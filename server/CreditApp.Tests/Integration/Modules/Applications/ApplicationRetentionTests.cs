namespace CreditApp.Tests.Integration.Modules.Applications;

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using CreditApp.Modules.Applications.Data.Models;
using CreditApp.Modules.Applications.Service;
using CreditApp.Modules.Identity.Service.Models;
using CreditApp.Modules.Identity.Web.Models;
using CreditApp.Shared.Data;
using CreditApp.Shared.Settings;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using TestHelpers;

using static CreditApp.Shared.Constants.Names;

public class ApplicationRetentionTests(
    CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private const int BackdateDays = 3;

    private const string SystemRetentionActor = "system-retention-worker";

    private static readonly byte[] ValidJpegBytes =
        [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02];

    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task Delete_AsApprover_ReturnsNoContentAndApplicationNoLongerAppearsInGetById()
    {
        var applicationId = await this.SubmitAndGetId();
        var token = await this.LoginAsNewStaffUser(ApproverRoleName);

        var deleteResponse = await this.SendDelete(applicationId, token);

        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getResponse = await this.SendGetById(applicationId, token);

        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task Delete_AsViewer_ReturnsForbidden()
    {
        var applicationId = await this.SubmitAndGetId();
        var token = await this.LoginAsNewStaffUser(ViewerRoleName);

        var response = await this.SendDelete(applicationId, token);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Delete_Anonymous_ReturnsUnauthorized()
    {
        var applicationId = await this.SubmitAndGetId();

        var response = await this.client.DeleteAsync($"/applications/{applicationId}/");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Delete_NonexistentId_ReturnsNotFound()
    {
        var token = await this.LoginAsNewStaffUser(ApproverRoleName);

        var response = await this.SendDelete(Guid.NewGuid(), token);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_CalledTwiceOnSameId_SecondCallReturnsNotFound()
    {
        var applicationId = await this.SubmitAndGetId();
        var token = await this.LoginAsNewStaffUser(ApproverRoleName);

        var firstResponse = await this.SendDelete(applicationId, token);
        Assert.Equal(HttpStatusCode.NoContent, firstResponse.StatusCode);

        var secondResponse = await this.SendDelete(applicationId, token);
        Assert.Equal(HttpStatusCode.NotFound, secondResponse.StatusCode);
    }

    [Fact]
    public async Task SoftDeleteExpired_FlagsOldApplicationAndReturnsCorrectCountWithoutTouchingRecentOne()
    {
        var oldApplicationId = await this.SubmitAndGetId();
        var recentApplicationId = await this.SubmitAndGetId();

        await this.BackdateCreatedOn(oldApplicationId, DateTime.UtcNow.AddDays(-BackdateDays));

        var softDeletedCount = await this.CallSoftDeleteExpired();

        Assert.Equal(1, softDeletedCount);

        var oldApplication = await this.FindIncludingDeleted(oldApplicationId);
        var recentApplication = await this.FindIncludingDeleted(recentApplicationId);

        Assert.NotNull(oldApplication);
        Assert.True(oldApplication!.IsDeleted);
        Assert.NotNull(oldApplication.DeletedOn);
        Assert.Equal(SystemRetentionActor, oldApplication.DeletedBy);

        Assert.NotNull(recentApplication);
        Assert.False(recentApplication!.IsDeleted);
    }

    [Fact]
    public async Task HardDeleteExpired_RemovesRowAndDeletesStoredImageAndReturnsCorrectCount()
    {
        var applicationId = await this.SubmitAndGetId();

        var token = await this.LoginAsNewStaffUser(ApproverRoleName);
        var deleteResponse = await this.SendDelete(applicationId, token);
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var applicationBeforeHardDelete = await this.FindIncludingDeleted(applicationId);
        Assert.NotNull(applicationBeforeHardDelete);

        var imagePath = this.ResolveImagePath(applicationBeforeHardDelete!.IdCardImagePath);
        Assert.True(File.Exists(imagePath));

        await this.BackdateDeletedOn(applicationId, DateTime.UtcNow.AddDays(-BackdateDays));

        var hardDeletedCount = await this.CallHardDeleteExpired();

        Assert.Equal(1, hardDeletedCount);

        var applicationAfterHardDelete = await this.FindIncludingDeleted(applicationId);
        Assert.Null(applicationAfterHardDelete);

        Assert.False(File.Exists(imagePath));
    }

    [Fact]
    public async Task HardDeleteExpired_DoesNotTouchApplicationStillWithinGracePeriod()
    {
        var applicationId = await this.SubmitAndGetId();

        var token = await this.LoginAsNewStaffUser(ApproverRoleName);
        var deleteResponse = await this.SendDelete(applicationId, token);
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var hardDeletedCount = await this.CallHardDeleteExpired();

        Assert.Equal(0, hardDeletedCount);

        var application = await this.FindIncludingDeleted(applicationId);

        Assert.NotNull(application);
        Assert.True(application!.IsDeleted);
    }

    private async Task<HttpResponseMessage> SendDelete(Guid applicationId, string token)
    {
        using var request = new HttpRequestMessage(HttpMethod.Delete, $"/applications/{applicationId}/");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        return await this.client.SendAsync(request);
    }

    private async Task<HttpResponseMessage> SendGetById(Guid applicationId, string token)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/applications/{applicationId}/");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        return await this.client.SendAsync(request);
    }

    private async Task BackdateCreatedOn(Guid applicationId, DateTime createdOn)
    {
        using var scope = factory.Services.CreateScope();
        var data = scope.ServiceProvider.GetRequiredService<CreditAppDbContext>();

        await data.Applications
            .IgnoreQueryFilters()
            .Where(a => a.Id == applicationId)
            .ExecuteUpdateAsync(setters => setters.SetProperty(a => a.CreatedOn, createdOn));
    }

    private async Task BackdateDeletedOn(Guid applicationId, DateTime deletedOn)
    {
        using var scope = factory.Services.CreateScope();
        var data = scope.ServiceProvider.GetRequiredService<CreditAppDbContext>();

        await data.Applications
            .IgnoreQueryFilters()
            .Where(a => a.Id == applicationId)
            .ExecuteUpdateAsync(setters => setters.SetProperty(a => a.DeletedOn, deletedOn));
    }

    private async Task<ApplicationDbModel?> FindIncludingDeleted(Guid applicationId)
    {
        using var scope = factory.Services.CreateScope();
        var data = scope.ServiceProvider.GetRequiredService<CreditAppDbContext>();

        return await data.Applications
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == applicationId);
    }

    private async Task<int> CallSoftDeleteExpired()
    {
        using var scope = factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IApplicationsService>();

        return await service.SoftDeleteExpired();
    }

    private async Task<int> CallHardDeleteExpired()
    {
        using var scope = factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IApplicationsService>();

        return await service.HardDeleteExpired();
    }

    private string ResolveImagePath(string relativePath)
    {
        var fileStorageSettings = factory.Services.GetRequiredService<IOptions<FileStorageSettings>>();

        return Path.Combine(fileStorageSettings.Value.UploadsRootPath, relativePath);
    }

    private async Task<Guid> SubmitAndGetId(string? egn = null, string? email = null)
    {
        using var content = BuildValidSubmissionContent(egn: egn, email: email);

        var response = await this.client.PostAsync("/applications/", content);
        var body = await response.Content.ReadFromJsonAsync<ApplicationSubmittedResponse>();

        return body!.Id;
    }

    private async Task<string> LoginAsNewStaffUser(string role)
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var username = $"itest.retention.{suffix}";
        const string password = "IntegrationTest123";

        await TestUserFactory.CreateStaffUser(factory.Services, username, password, role);

        var loginPayload = new LoginWebModel
        {
            Credentials = username,
            Password = password,
            RememberMe = false
        };

        var loginResponse = await this.client.PostAsJsonAsync("/identity/login/", loginPayload);
        var body = await loginResponse.Content.ReadFromJsonAsync<JwtTokenServiceModel>();

        return body!.Token;
    }

    private static MultipartFormDataContent BuildValidSubmissionContent(
        string? egn = null,
        string? email = null)
    {
        var content = new MultipartFormDataContent
        {
            { new StringContent("Ivan"), "FirstName" },
            { new StringContent("Petrov"), "LastName" },
            { new StringContent(egn ?? NewEgn()), "Egn" },
            { new StringContent("0888123456"), "Phone" },
            { new StringContent(email ?? $"applicant.{Guid.NewGuid():N}@test.local"), "Email" },
            { new StringContent("5000"), "RequestedAmount" },
            { new StringContent("24"), "RequestedTermMonths" },
            {
                CreateFilePart(ValidJpegBytes, "image/jpeg"),
                "IdCardImage",
                "id-card.jpg"
            }
        };

        return content;
    }

    private static ByteArrayContent CreateFilePart(byte[] bytes, string contentType)
    {
        var part = new ByteArrayContent(bytes);
        part.Headers.ContentType = new MediaTypeHeaderValue(contentType);

        return part;
    }

    private static string NewEgn()
    {
        var year = Random.Shared.Next(0, 100);
        var month = Random.Shared.Next(1, 13);
        var day = Random.Shared.Next(1, 28);
        var sequence = Random.Shared.Next(100, 999);

        var digits = $"{year:D2}{month:D2}{day:D2}{sequence:D3}";

        int[] weights = [2, 4, 8, 5, 10, 9, 7, 3, 6];
        var sum = 0;

        for (var i = 0; i < 9; i++)
        {
            sum += (digits[i] - '0') * weights[i];
        }

        var checksum = sum % 11;

        if (checksum == 10)
        {
            checksum = 0;
        }

        return $"{digits}{checksum}";
    }

    private sealed record ApplicationSubmittedResponse(Guid Id);
}

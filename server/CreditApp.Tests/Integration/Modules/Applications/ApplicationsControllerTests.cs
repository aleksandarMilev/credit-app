namespace CreditApp.Tests.Integration.Modules.Applications;

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using CreditApp.Modules.Applications.Data.Models;
using CreditApp.Modules.Applications.Web.Models;
using CreditApp.Modules.Email;
using CreditApp.Modules.Identity.Service.Models;
using CreditApp.Modules.Identity.Web.Models;
using CreditApp.Shared.Models;
using Microsoft.Extensions.DependencyInjection;
using TestHelpers;

using static CreditApp.Shared.Constants.Names;

public class ApplicationsControllerTests(
    CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly byte[] ValidJpegBytes =
        [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02];

    private static readonly byte[] ValidPngBytes =
        [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00];

    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task Submit_ValidPayload_ReturnsOkAndSendsConfirmationEmail()
    {
        var egn = NewEgn();
        var email = $"applicant.{Guid.NewGuid():N}@test.local";

        using var content = BuildValidSubmissionContent(
            egn: egn,
            email: email);

        var response = await this.client.PostAsync("/applications/", content);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ApplicationSubmittedResponse>();

        Assert.NotNull(body);
        Assert.NotEqual(Guid.Empty, body!.Id);

        var fakeEmailSender = (FakeEmailSender)factory.Services.GetRequiredService<IEmailSender>();

        Assert.Contains(email, fakeEmailSender.ApplicationSubmittedEmailsSentTo);
    }

    [Fact]
    public async Task Submit_UnsupportedImageType_ReturnsBadRequest()
    {
        using var content = BuildValidSubmissionContent(includeIdCardImage: false);

        content.Add(
            CreateFilePart([1, 2, 3], "application/pdf"),
            "IdCardImage",
            "id-card.pdf");

        var response = await this.client.PostAsync("/applications/", content);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Submit_MissingRequiredField_ReturnsBadRequest()
    {
        using var content = BuildValidSubmissionContent(includeFirstName: false);

        var response = await this.client.PostAsync("/applications/", content);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Submit_InvalidEgnChecksum_ReturnsBadRequest()
    {
        using var content = BuildValidSubmissionContent(egn: "1234567890");

        var response = await this.client.PostAsync("/applications/", content);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData("abcdefghij")]
    [InlineData("12345")]
    [InlineData("0000000000")]
    public async Task Submit_InvalidPhoneFormat_ReturnsBadRequest(string invalidPhone)
    {
        using var content = BuildValidSubmissionContent(phone: invalidPhone);

        var response = await this.client.PostAsync("/applications/", content);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData("0888123456")]
    [InlineData("+359888123456")]
    public async Task Submit_ValidPhoneFormat_ReturnsOk(string validPhone)
    {
        using var content = BuildValidSubmissionContent(phone: validPhone);

        var response = await this.client.PostAsync("/applications/", content);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Submit_ExtensionContentTypeMismatch_ReturnsBadRequest()
    {
        using var content = BuildValidSubmissionContent(includeIdCardImage: false);

        content.Add(
            CreateFilePart(ValidPngBytes, "image/jpeg"),
            "IdCardImage",
            "id-card.png");

        var response = await this.client.PostAsync("/applications/", content);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Submit_ContentDoesNotMatchClaimedFormat_ReturnsBadRequest()
    {
        using var content = BuildValidSubmissionContent(includeIdCardImage: false);

        var fakeBytes = "this is not actually a jpeg file at all!"u8.ToArray();

        content.Add(
            CreateFilePart(fakeBytes, "image/jpeg"),
            "IdCardImage",
            "id-card.jpg");

        var response = await this.client.PostAsync("/applications/", content);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Submit_EmptyImage_ReturnsBadRequest()
    {
        using var content = BuildValidSubmissionContent(includeIdCardImage: false);

        content.Add(
            CreateFilePart([], "image/jpeg"),
            "IdCardImage",
            "id-card.jpg");

        var response = await this.client.PostAsync("/applications/", content);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Submit_OversizedImage_ReturnsBadRequest()
    {
        const int OversizedByteCount = (10 * 1_024 * 1_024) + 1;

        var oversizedBytes = new byte[OversizedByteCount];
        ValidJpegBytes.CopyTo(oversizedBytes, 0);

        using var content = BuildValidSubmissionContent(includeIdCardImage: false);

        content.Add(
            CreateFilePart(oversizedBytes, "image/jpeg"),
            "IdCardImage",
            "id-card.jpg");

        var response = await this.client.PostAsync("/applications/", content);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Submit_DuplicatePendingEgn_ReturnsConflict()
    {
        var egn = NewEgn();

        using var firstContent = BuildValidSubmissionContent(egn: egn);
        var firstResponse = await this.client.PostAsync("/applications/", firstContent);

        Assert.Equal(HttpStatusCode.OK, firstResponse.StatusCode);

        using var secondContent = BuildValidSubmissionContent(egn: egn);
        var secondResponse = await this.client.PostAsync("/applications/", secondContent);

        Assert.Equal(HttpStatusCode.Conflict, secondResponse.StatusCode);
    }

    [Fact]
    public async Task Submit_SameEgnAfterFirstApplicationReviewed_ReturnsOk()
    {
        var egn = NewEgn();

        var applicationId = await this.SubmitAndGetId(egn: egn);
        var token = await this.LoginAsNewStaffUser(ApproverRoleName);

        await this.SendStatusUpdate(applicationId, ApplicationDecision.Rejected, token);

        using var secondContent = BuildValidSubmissionContent(egn: egn);
        var secondResponse = await this.client.PostAsync("/applications/", secondContent);

        Assert.Equal(HttpStatusCode.OK, secondResponse.StatusCode);
    }

    [Fact]
    public async Task GetAll_AsApprover_ReturnsSubmittedApplication()
    {
        var applicationId = await this.SubmitAndGetId();

        var token = await this.LoginAsNewStaffUser(ApproverRoleName);

        using var request = new HttpRequestMessage(HttpMethod.Get, "/applications/");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await this.client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<PagedResult<ApplicationSummaryResponse>>();

        Assert.NotNull(body);
        Assert.Contains(body!.Items, a => a.Id == applicationId);
    }

    [Fact]
    public async Task GetAll_AsViewer_ReturnsOk()
    {
        var token = await this.LoginAsNewStaffUser(ViewerRoleName);

        using var request = new HttpRequestMessage(HttpMethod.Get, "/applications/");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await this.client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetAll_Anonymous_ReturnsUnauthorized()
    {
        var response = await this.client.GetAsync("/applications/");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetAll_FilterByStatus_ReturnsOnlyMatchingApplications()
    {
        var pendingId = await this.SubmitAndGetId();
        var approvedId = await this.SubmitAndGetId();

        var token = await this.LoginAsNewStaffUser(ApproverRoleName);

        await this.SendStatusUpdate(approvedId, ApplicationDecision.Approved, token);

        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"/applications/?status={ApplicationStatus.Pending}");

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await this.client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<PagedResult<ApplicationSummaryResponse>>();

        Assert.NotNull(body);
        Assert.Contains(body!.Items, a => a.Id == pendingId);
        Assert.DoesNotContain(body.Items, a => a.Id == approvedId);
    }

    [Fact]
    public async Task GetById_NonexistentId_ReturnsNotFound()
    {
        var token = await this.LoginAsNewStaffUser(ApproverRoleName);

        using var request = new HttpRequestMessage(HttpMethod.Get, $"/applications/{Guid.NewGuid()}/");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await this.client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ExistingId_ReturnsFullDetail()
    {
        var egn = NewEgn();

        var applicationId = await this.SubmitAndGetId(egn: egn);
        var token = await this.LoginAsNewStaffUser(ApproverRoleName);

        using var request = new HttpRequestMessage(HttpMethod.Get, $"/applications/{applicationId}/");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await this.client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ApplicationDetailResponse>();

        Assert.NotNull(body);
        Assert.Equal(egn, body!.Egn);
        Assert.Equal(ApplicationStatus.Pending, body.Status);
    }

    [Fact]
    public async Task GetById_AsViewer_ReturnsOk()
    {
        var applicationId = await this.SubmitAndGetId();
        var token = await this.LoginAsNewStaffUser(ViewerRoleName);

        using var request = new HttpRequestMessage(HttpMethod.Get, $"/applications/{applicationId}/");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await this.client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetById_Anonymous_ReturnsUnauthorized()
    {
        var applicationId = await this.SubmitAndGetId();

        var response = await this.client.GetAsync($"/applications/{applicationId}/");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetDocument_ExistingId_ReturnsUploadedImageBytes()
    {
        var applicationId = await this.SubmitAndGetId(imageBytes: ValidJpegBytes);
        var token = await this.LoginAsNewStaffUser(ApproverRoleName);

        using var request = new HttpRequestMessage(HttpMethod.Get, $"/applications/{applicationId}/document/");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await this.client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("image/jpeg", response.Content.Headers.ContentType?.MediaType);

        var returnedBytes = await response.Content.ReadAsByteArrayAsync();

        Assert.Equal(ValidJpegBytes, returnedBytes);
    }

    [Fact]
    public async Task GetDocument_AsViewer_ReturnsOk()
    {
        var applicationId = await this.SubmitAndGetId();
        var token = await this.LoginAsNewStaffUser(ViewerRoleName);

        using var request = new HttpRequestMessage(HttpMethod.Get, $"/applications/{applicationId}/document/");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await this.client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetDocument_NonexistentId_ReturnsNotFound()
    {
        var token = await this.LoginAsNewStaffUser(ApproverRoleName);

        using var request = new HttpRequestMessage(HttpMethod.Get, $"/applications/{Guid.NewGuid()}/document/");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await this.client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetDocument_Anonymous_ReturnsUnauthorized()
    {
        var applicationId = await this.SubmitAndGetId();

        var response = await this.client.GetAsync($"/applications/{applicationId}/document/");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UpdateStatus_AsApproverApprove_ReturnsOkAndSendsApprovalEmail()
    {
        var email = $"applicant.{Guid.NewGuid():N}@test.local";

        var applicationId = await this.SubmitAndGetId(email: email);
        var token = await this.LoginAsNewStaffUser(ApproverRoleName);

        var response = await this.SendStatusUpdate(applicationId, ApplicationDecision.Approved, token);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ApplicationDetailResponse>();

        Assert.NotNull(body);
        Assert.Equal(ApplicationStatus.Approved, body!.Status);
        Assert.NotNull(body.ReviewedBy);
        Assert.NotNull(body.ReviewedOn);

        var fakeEmailSender = (FakeEmailSender)factory.Services.GetRequiredService<IEmailSender>();

        Assert.Contains(email, fakeEmailSender.ApplicationApprovedEmailsSentTo);
    }

    [Fact]
    public async Task UpdateStatus_AsApproverReject_ReturnsOkAndSendsRejectionEmail()
    {
        var email = $"applicant.{Guid.NewGuid():N}@test.local";

        var applicationId = await this.SubmitAndGetId(email: email);
        var token = await this.LoginAsNewStaffUser(ApproverRoleName);

        var response = await this.SendStatusUpdate(applicationId, ApplicationDecision.Rejected, token);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var fakeEmailSender = (FakeEmailSender)factory.Services.GetRequiredService<IEmailSender>();

        Assert.Contains(email, fakeEmailSender.ApplicationRejectedEmailsSentTo);
    }

    [Fact]
    public async Task UpdateStatus_WithNote_PersistsNote()
    {
        var applicationId = await this.SubmitAndGetId();
        var token = await this.LoginAsNewStaffUser(ApproverRoleName);

        const string reviewNote = "Missing proof of address, contacted applicant.";

        using var request = new HttpRequestMessage(HttpMethod.Put, $"/applications/{applicationId}/status/")
        {
            Content = JsonContent.Create(
                new UpdateApplicationStatusWebModel
                {
                    Decision = ApplicationDecision.Rejected,
                    Note = reviewNote
                })
        };

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await this.client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ApplicationDetailResponse>();

        Assert.NotNull(body);
        Assert.Equal(reviewNote, body!.ReviewNote);
    }

    [Fact]
    public async Task UpdateStatus_AsViewer_ReturnsForbidden()
    {
        var applicationId = await this.SubmitAndGetId();
        var token = await this.LoginAsNewStaffUser(ViewerRoleName);

        var response = await this.SendStatusUpdate(applicationId, ApplicationDecision.Approved, token);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task UpdateStatus_Anonymous_ReturnsUnauthorized()
    {
        var applicationId = await this.SubmitAndGetId();

        using var request = new HttpRequestMessage(HttpMethod.Put, $"/applications/{applicationId}/status/")
        {
            Content = JsonContent.Create(
                new UpdateApplicationStatusWebModel { Decision = ApplicationDecision.Approved })
        };

        var response = await this.client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UpdateStatus_AlreadyReviewed_ReturnsConflict()
    {
        var applicationId = await this.SubmitAndGetId();
        var token = await this.LoginAsNewStaffUser(ApproverRoleName);

        await this.SendStatusUpdate(applicationId, ApplicationDecision.Approved, token);
        var secondResponse = await this.SendStatusUpdate(applicationId, ApplicationDecision.Rejected, token);

        Assert.Equal(HttpStatusCode.Conflict, secondResponse.StatusCode);
    }

    [Fact]
    public async Task UpdateStatus_NonexistentId_ReturnsNotFound()
    {
        var token = await this.LoginAsNewStaffUser(ApproverRoleName);

        var response = await this.SendStatusUpdate(Guid.NewGuid(), ApplicationDecision.Approved, token);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private async Task<HttpResponseMessage> SendStatusUpdate(
        Guid applicationId,
        ApplicationDecision decision,
        string token)
    {
        using var request = new HttpRequestMessage(HttpMethod.Put, $"/applications/{applicationId}/status/")
        {
            Content = JsonContent.Create(new UpdateApplicationStatusWebModel { Decision = decision })
        };

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        return await this.client.SendAsync(request);
    }

    private async Task<Guid> SubmitAndGetId(
        string? egn = null,
        string? email = null,
        byte[]? imageBytes = null)
    {
        using var content = BuildValidSubmissionContent(
            egn: egn,
            email: email,
            imageBytes: imageBytes);

        var response = await this.client.PostAsync("/applications/", content);
        var body = await response.Content.ReadFromJsonAsync<ApplicationSubmittedResponse>();

        return body!.Id;
    }

    private async Task<string> LoginAsNewStaffUser(string role)
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var username = $"itest.applications.{suffix}";
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
        string? email = null,
        string? phone = null,
        byte[]? imageBytes = null,
        bool includeFirstName = true,
        bool includeIdCardImage = true)
    {
        var content = new MultipartFormDataContent();

        if (includeFirstName)
        {
            content.Add(new StringContent("Ivan"), "FirstName");
        }

        content.Add(new StringContent("Petrov"), "LastName");
        content.Add(new StringContent(egn ?? NewEgn()), "Egn");
        content.Add(new StringContent(phone ?? "0888123456"), "Phone");
        content.Add(new StringContent(email ?? $"applicant.{Guid.NewGuid():N}@test.local"), "Email");
        content.Add(new StringContent("5000"), "RequestedAmount");
        content.Add(new StringContent("24"), "RequestedTermMonths");

        if (includeIdCardImage)
        {
            content.Add(
                CreateFilePart(imageBytes ?? ValidJpegBytes, "image/jpeg"),
                "IdCardImage",
                "id-card.jpg");
        }

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

    private sealed record ApplicationSummaryResponse(
        Guid Id,
        string FirstName,
        string LastName,
        decimal RequestedAmount,
        int RequestedTermMonths,
        ApplicationStatus Status,
        DateTime CreatedOn);

    private sealed record ApplicationDetailResponse(
        Guid Id,
        string FirstName,
        string LastName,
        string Egn,
        string Phone,
        string Email,
        decimal RequestedAmount,
        int RequestedTermMonths,
        ApplicationStatus Status,
        string? ReviewNote,
        string? ReviewedBy,
        DateTime? ReviewedOn,
        DateTime CreatedOn);
}

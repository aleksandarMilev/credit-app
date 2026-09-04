namespace CreditApp.Tests.Integration.Modules.InterestRate;

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using CreditApp.Modules.Identity.Service.Models;
using CreditApp.Modules.Identity.Web.Models;
using CreditApp.Modules.InterestRate.Web.Models;
using TestHelpers;

using static CreditApp.Shared.Constants.Names;

public class InterestRateControllerTests(
    CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task GetCurrent_Anonymous_ReturnsOk()
    {
        var response = await this.client.GetAsync("/interestrate/");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<InterestRateResponse>();

        Assert.NotNull(body);
        Assert.True(body!.AnnualRatePercent > 0);
    }

    [Fact]
    public async Task Update_AsApprover_ReturnsOkAndUpdatesRate()
    {
        var token = await this.LoginAsNewStaffUser(ApproverRoleName);

        const decimal newRate = 12.5m;

        var response = await this.SendUpdate(newRate, token);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<InterestRateResponse>();

        Assert.NotNull(body);
        Assert.Equal(newRate, body!.AnnualRatePercent);
        Assert.NotNull(body.ModifiedBy);
        Assert.NotNull(body.ModifiedOn);
    }

    [Fact]
    public async Task Update_PersistsAcrossSubsequentGet()
    {
        var token = await this.LoginAsNewStaffUser(ApproverRoleName);

        const decimal newRate = 15.25m;

        await this.SendUpdate(newRate, token);

        var getResponse = await this.client.GetAsync("/interestrate/");
        var body = await getResponse.Content.ReadFromJsonAsync<InterestRateResponse>();

        Assert.NotNull(body);
        Assert.Equal(newRate, body!.AnnualRatePercent);
    }

    [Fact]
    public async Task Update_AsViewer_ReturnsForbidden()
    {
        var token = await this.LoginAsNewStaffUser(ViewerRoleName);

        var response = await this.SendUpdate(10m, token);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Update_Anonymous_ReturnsUnauthorized()
    {
        using var request = new HttpRequestMessage(HttpMethod.Put, "/interestrate/")
        {
            Content = JsonContent.Create(new UpdateInterestRateWebModel { AnnualRatePercent = 10m })
        };

        var response = await this.client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(100)]
    [InlineData(250)]
    public async Task Update_OutOfRangeValue_ReturnsBadRequest(decimal invalidRate)
    {
        var token = await this.LoginAsNewStaffUser(ApproverRoleName);

        var response = await this.SendUpdate(invalidRate, token);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private async Task<HttpResponseMessage> SendUpdate(decimal rate, string token)
    {
        using var request = new HttpRequestMessage(HttpMethod.Put, "/interestrate/")
        {
            Content = JsonContent.Create(new UpdateInterestRateWebModel { AnnualRatePercent = rate })
        };

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        return await this.client.SendAsync(request);
    }

    private async Task<string> LoginAsNewStaffUser(string role)
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var username = $"itest.interestrate.{suffix}";
        const string password = "IntegrationTest123";

        await TestUserFactory.CreateStaffUser(factory.Services, username, password, role);

        var loginResponse = await this.client.PostAsJsonAsync(
            "/identity/login/",
            new LoginWebModel { Credentials = username, Password = password, RememberMe = false });

        var body = await loginResponse.Content.ReadFromJsonAsync<JwtTokenServiceModel>();

        return body!.Token;
    }

    private sealed record InterestRateResponse(
        decimal AnnualRatePercent,
        DateTime? ModifiedOn,
        string? ModifiedBy);
}

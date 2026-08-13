namespace CreditApp.Tests.Integration.Modules.Identity;

using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using CreditApp.Modules.Identity.Service.Models;
using CreditApp.Modules.Identity.Web.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using TestHelpers;

public class IdentityControllerTests(
    CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient client = factory.CreateClient();

    private static RegisterWebModel ValidRegisterPayload(string suffix)
        => new()
        {
            Username = $"itest.user.{suffix}",
            Email = $"itest.user.{suffix}@test.local",
            Password = "IntegrationTest123",
            FirstName = "Integration",
            LastName = "Tester",
            DateOfBirth = new DateTime(1995, 6, 15)
        };

    [Fact]
    public async Task Register_ValidPayload_ReturnsSuccessWithJwt()
    {
        var payload = ValidRegisterPayload(Guid.NewGuid().ToString("N")[..8]);

        var response = await this.client.PostAsJsonAsync("/identity/register/", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<JwtTokenServiceModel>();

        Assert.NotNull(body);
        Assert.False(string.IsNullOrWhiteSpace(body!.Token));
    }

    [Fact]
    public async Task Register_DuplicateUsername_ReturnsConflict()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var firstPayload = ValidRegisterPayload(suffix);

        var firstResponse = await this.client.PostAsJsonAsync("/identity/register/", firstPayload);
        Assert.Equal(HttpStatusCode.OK, firstResponse.StatusCode);

        var duplicatePayload = new RegisterWebModel
        {
            Username = firstPayload.Username,
            Email = $"different.{suffix}@test.local",
            Password = "IntegrationTest123",
            FirstName = "Integration",
            LastName = "Tester",
            DateOfBirth = new DateTime(1995, 6, 15)
        };

        var secondResponse = await this.client.PostAsJsonAsync("/identity/register/", duplicatePayload);

        Assert.Equal(HttpStatusCode.Conflict, secondResponse.StatusCode);

        var problem = await secondResponse.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.Equal("Conflict", problem?.Title);
    }

    [Fact]
    public async Task Register_InvalidPayload_ReturnsBadRequest()
    {
        var invalidPayload = new RegisterWebModel
        {
            Username = "",
            Email = "not-an-email",
            Password = "123",
            FirstName = "",
            LastName = "",
            DateOfBirth = DateTime.UtcNow.AddYears(-5)
        };

        var response = await this.client.PostAsJsonAsync("/identity/register/", invalidPayload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsJwt()
    {
        var registerPayload = ValidRegisterPayload(Guid.NewGuid().ToString("N")[..8]);
        var registerResponse = await this.client.PostAsJsonAsync("/identity/register/", registerPayload);
        Assert.Equal(HttpStatusCode.OK, registerResponse.StatusCode);

        var loginPayload = new LoginWebModel
        {
            Credentials = registerPayload.Username,
            Password = registerPayload.Password,
            RememberMe = false
        };

        var loginResponse = await this.client.PostAsJsonAsync("/identity/login/", loginPayload);

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var body = await loginResponse.Content.ReadFromJsonAsync<JwtTokenServiceModel>();

        Assert.NotNull(body);
        Assert.False(string.IsNullOrWhiteSpace(body!.Token));
    }

    [Fact]
    public async Task Login_WrongCredentials_ReturnsUnauthorized()
    {
        var registerPayload = ValidRegisterPayload(Guid.NewGuid().ToString("N")[..8]);
        var registerResponse = await this.client.PostAsJsonAsync("/identity/register/", registerPayload);
        Assert.Equal(HttpStatusCode.OK, registerResponse.StatusCode);

        var loginPayload = new LoginWebModel
        {
            Credentials = registerPayload.Username,
            Password = "TotallyWrongPassword123",
            RememberMe = false
        };

        var loginResponse = await this.client.PostAsJsonAsync("/identity/login/", loginPayload);

        Assert.Equal(HttpStatusCode.Unauthorized, loginResponse.StatusCode);
    }

    [Fact]
    public async Task Login_ReturnedJwt_ValidatesAgainstConfiguredJwtSettings()
    {
        var registerPayload = ValidRegisterPayload(Guid.NewGuid().ToString("N")[..8]);
        await this.client.PostAsJsonAsync("/identity/register/", registerPayload);

        var loginPayload = new LoginWebModel
        {
            Credentials = registerPayload.Username,
            Password = registerPayload.Password,
            RememberMe = false
        };

        var loginResponse = await this.client.PostAsJsonAsync("/identity/login/", loginPayload);
        var body = await loginResponse.Content.ReadFromJsonAsync<JwtTokenServiceModel>();

        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = CustomWebApplicationFactory.JwtIssuer,
            ValidateAudience = true,
            ValidAudience = CustomWebApplicationFactory.JwtAudience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(CustomWebApplicationFactory.JwtSecret)),
            ValidateLifetime = true
        };

        var handler = new JwtSecurityTokenHandler();
        var principal = handler.ValidateToken(body!.Token, validationParameters, out var validatedToken);

        Assert.NotNull(validatedToken);
        Assert.Equal(registerPayload.Username, principal.Identity?.Name);
        Assert.Contains(
            principal.Claims,
            c => c.Type == ClaimTypes.Email && c.Value == registerPayload.Email);
    }
}

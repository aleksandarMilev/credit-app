namespace CreditApp.Tests.Integration.Modules.Identity;

using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using CreditApp.Modules.Email;
using CreditApp.Modules.Identity.Data.Models;
using CreditApp.Modules.Identity.Service.Models;
using CreditApp.Modules.Identity.Web.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using TestHelpers;

using static CreditApp.Shared.Constants.Names;

public class IdentityControllerTests(
    CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task Login_ValidCredentials_ReturnsJwt()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var username = $"itest.approver.{suffix}";

        const string password = "IntegrationTest123";

        await TestUserFactory.CreateStaffUser(
            factory.Services,
            username,
            password,
            ApproverRoleName);

        var loginPayload = new LoginWebModel
        {
            Credentials = username,
            Password = password,
            RememberMe = false
        };

        var loginResponse = await this.client.PostAsJsonAsync(
            "/identity/login/",
            loginPayload);

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var body = await loginResponse
            .Content
            .ReadFromJsonAsync<JwtTokenServiceModel>();

        Assert.NotNull(body);
        Assert.False(string.IsNullOrWhiteSpace(body!.Token));
    }

    [Fact]
    public async Task Login_WrongCredentials_ReturnsUnauthorized()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var username = $"itest.approver.{suffix}";
        const string password = "IntegrationTest123";

        await TestUserFactory.CreateStaffUser(
            factory.Services,
            username,
            password,
            ApproverRoleName);

        var loginPayload = new LoginWebModel
        {
            Credentials = username,
            Password = "TotallyWrongPassword123",
            RememberMe = false
        };

        var loginResponse = await this.client.PostAsJsonAsync(
            "/identity/login/",
            loginPayload);

        Assert.Equal(HttpStatusCode.Unauthorized, loginResponse.StatusCode);
    }

    [Fact]
    public async Task Login_ReturnedJwt_ValidatesAgainstConfiguredJwtSettingsAndContainsRoleClaim()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var username = $"itest.viewer.{suffix}";
        const string password = "IntegrationTest123";

        await TestUserFactory.CreateStaffUser(
            factory.Services,
            username,
            password,
            ViewerRoleName);

        var loginPayload = new LoginWebModel
        {
            Credentials = username,
            Password = password,
            RememberMe = false
        };

        var loginResponse = await this.client.PostAsJsonAsync(
            "/identity/login/",
            loginPayload);

        var body = await loginResponse
            .Content
            .ReadFromJsonAsync<JwtTokenServiceModel>();

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
        var principal = handler.ValidateToken(
            body!.Token,
            validationParameters,
            out var validatedToken);

        Assert.NotNull(validatedToken);
        Assert.Equal(username, principal.Identity?.Name);
        Assert.Contains(
            principal.Claims,
            static c => c.Type == ClaimTypes.Role && c.Value == ViewerRoleName);
    }

    [Fact]
    public async Task Login_UserWithNoRole_ReturnsForbidden()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var username = $"itest.norole.{suffix}";
        const string password = "IntegrationTest123";

        var userManager = factory.Services.GetRequiredService<UserManager<UserDbModel>>();

        var user = new UserDbModel
        {
            UserName = username,
            Email = $"{username}@test.local",
            EmailConfirmed = true,
            LockoutEnabled = true,
            FirstName = "Test",
            LastName = "User"
        };

        await userManager.CreateAsync(user, password);

        var loginPayload = new LoginWebModel
        {
            Credentials = username,
            Password = password,
            RememberMe = false
        };

        var loginResponse = await this.client.PostAsJsonAsync(
            "/identity/login/",
            loginPayload);

        Assert.Equal(HttpStatusCode.Forbidden, loginResponse.StatusCode);
    }

    [Fact]
    public async Task ForgotPassword_ExistingUser_ReturnsOkAndSendsEmail()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var username = $"itest.forgot.{suffix}";
        var email = $"{username}@test.local";

        const string password = "IntegrationTest123";

        await TestUserFactory.CreateStaffUser(
            factory.Services,
            username,
            password,
            ApproverRoleName);

        var payload = new ForgotPasswordWebModel { Email = email };

        var response = await this.client.PostAsJsonAsync(
            "/identity/forgot-password/",
            payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var fakeEmailSender = (FakeEmailSender)factory
            .Services
            .GetRequiredService<IEmailSender>();

        Assert.Contains(email, fakeEmailSender.PasswordResetEmailsSentTo);
    }

    [Fact]
    public async Task ForgotPassword_NonexistentEmail_ReturnsOkWithoutRevealingAbsence()
    {
        var email = $"itest.nonexistent.{Guid.NewGuid():N}@test.local";

        var payload = new ForgotPasswordWebModel { Email = email };

        var response = await this.client.PostAsJsonAsync(
            "/identity/forgot-password/",
            payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var fakeEmailSender = (FakeEmailSender)factory
            .Services
            .GetRequiredService<IEmailSender>();

        Assert.DoesNotContain(email, fakeEmailSender.PasswordResetEmailsSentTo);
    }

    [Fact]
    public async Task ResetPassword_ValidToken_ReturnsOkAndAllowsLoginWithNewPassword()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var username = $"itest.reset.{suffix}";
        var email = $"{username}@test.local";

        const string oldPassword = "IntegrationTest123";
        const string newPassword = "NewIntegrationTest456";

        var user = await TestUserFactory.CreateStaffUser(
            factory.Services,
            username,
            oldPassword,
            ApproverRoleName);

        var userManager = factory
            .Services
            .GetRequiredService<UserManager<UserDbModel>>();

        var rawToken = await userManager.GeneratePasswordResetTokenAsync(user);
        var tokenBytes = Encoding.UTF8.GetBytes(rawToken);
        var encodedToken = WebEncoders.Base64UrlEncode(tokenBytes);

        var resetPayload = new ResetPasswordWebModel
        {
            Email = email,
            Token = encodedToken,
            NewPassword = newPassword
        };

        var resetResponse = await this.client.PostAsJsonAsync(
            "/identity/reset-password/",
            resetPayload);

        Assert.Equal(HttpStatusCode.OK, resetResponse.StatusCode);

        var loginPayload = new LoginWebModel
        {
            Credentials = username,
            Password = newPassword,
            RememberMe = false
        };

        var loginResponse = await this.client.PostAsJsonAsync(
            "/identity/login/",
            loginPayload);

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
    }

    [Fact]
    public async Task ResetPassword_InvalidToken_ReturnsBadRequest()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var username = $"itest.badtoken.{suffix}";
        var email = $"{username}@test.local";

        const string password = "IntegrationTest123";

        await TestUserFactory.CreateStaffUser(
            factory.Services,
            username,
            password,
            ApproverRoleName);

        var resetPayload = new ResetPasswordWebModel
        {
            Email = email,
            Token = "not-a-real-token",
            NewPassword = "SomeNewPassword789"
        };

        var resetResponse = await this.client.PostAsJsonAsync(
            "/identity/reset-password/",
            resetPayload);

        Assert.Equal(HttpStatusCode.BadRequest, resetResponse.StatusCode);
    }

    [Fact]
    public async Task ResetPassword_NonexistentEmail_ReturnsBadRequest()
    {
        var resetPayload = new ResetPasswordWebModel
        {
            Email = $"itest.ghost.{Guid.NewGuid():N}@test.local",
            Token = "irrelevant-token",
            NewPassword = "SomeNewPassword789"
        };

        var resetResponse = await this.client.PostAsJsonAsync(
            "/identity/reset-password/",
            resetPayload);

        Assert.Equal(HttpStatusCode.BadRequest, resetResponse.StatusCode);
    }

    // Exercises the real UserManager.ResetPasswordAsync password validators
    // (not a mock) end to end, to confirm BulgarianIdentityErrorDescriber is
    // actually wired up via AddErrorDescriber in the running app — not just
    // that it compiles. The Testing environment uses the same non-dev
    // password policy as production (RequireDigit/RequireLowercase/
    // RequireUppercase), so an all-lowercase, digit-free password reliably
    // fails both PasswordRequiresDigit and PasswordRequiresUpper.
    [Fact]
    public async Task ResetPassword_NewPasswordFailsPolicy_ReturnsBadRequestWithBulgarianDetail()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var username = $"itest.weakpwd.{suffix}";
        var email = $"{username}@test.local";

        const string oldPassword = "IntegrationTest123";

        var user = await TestUserFactory.CreateStaffUser(
            factory.Services,
            username,
            oldPassword,
            ApproverRoleName);

        var userManager = factory
            .Services
            .GetRequiredService<UserManager<UserDbModel>>();

        var rawToken = await userManager.GeneratePasswordResetTokenAsync(user);
        var tokenBytes = Encoding.UTF8.GetBytes(rawToken);
        var encodedToken = WebEncoders.Base64UrlEncode(tokenBytes);

        var resetPayload = new ResetPasswordWebModel
        {
            Email = email,
            Token = encodedToken,
            NewPassword = "onlylowercase"
        };

        var resetResponse = await this.client.PostAsJsonAsync(
            "/identity/reset-password/",
            resetPayload);

        Assert.Equal(HttpStatusCode.BadRequest, resetResponse.StatusCode);

        var problem = await resetResponse.Content.ReadFromJsonAsync<ProblemDetails>();

        Assert.NotNull(problem?.Detail);
        Assert.Contains("цифра", problem.Detail);
        Assert.Contains("главна буква", problem.Detail);
        Assert.DoesNotContain("digit", problem.Detail, StringComparison.OrdinalIgnoreCase);
    }
}
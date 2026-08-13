namespace CreditApp.Tests.Unit.Modules.Identity;

using System.Text;
using CreditApp.Modules.Email;
using CreditApp.Modules.Identity.Data.Models;
using CreditApp.Modules.Identity.Service;
using CreditApp.Modules.Identity.Service.Models;
using CreditApp.Modules.Identity.Shared.Errors;
using CreditApp.Shared.Settings;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using TestHelpers;

using static CreditApp.Shared.Constants.Names;

public class IdentityServiceTests
{
    private const string ClientBaseUrl = "http://localhost:5173";

    private static(
        IdentityService Service,
        Mock<UserManager<UserDbModel>> UserManager,
        Mock<IEmailSender> EmailSender) 
        CreateService(
        IEnumerable<UserDbModel>? existingUsers = null,
        string? clientBaseUrl = ClientBaseUrl)
    {
        var userManagerMock = MockUserManagerFactory.Create(existingUsers);
        var emailSenderMock = new Mock<IEmailSender>();

        var jwtSettings = Options.Create(new JwtSettings
        {
            Secret = "unit-test-super-secret-signing-key-value",
            Issuer = "CreditApp",
            Audience = "CreditAppClient"
        });

        var appUrlsSettings = Options.Create(new AppUrlsSettings
        {
            ClientBaseUrl = clientBaseUrl!
        });

        var service = new IdentityService(
            userManagerMock.Object,
            emailSenderMock.Object,
            NullLogger<IdentityService>.Instance,
            jwtSettings,
            appUrlsSettings);

        return (service, userManagerMock, emailSenderMock);
    }

    private static RegisterServiceModel ValidRegisterModel(
        string username = "new.user",
        string email = "new.user@test.local",
        string password = "Password123")
        => new(
            username,
            email,
            password,
            "New",
            "User",
            new DateTime(1995, 5, 20));

    #region Register

    [Fact]
    public async Task Register_ValidData_ReturnsSuccessWithJwt()
    {
        var (service, userManager, emailSender) = CreateService();

        userManager
            .Setup(static m => m.CreateAsync(It.IsAny<UserDbModel>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);

        var result = await service.Register(ValidRegisterModel());

        Assert.True(result.IsSuccess);
        Assert.False(string.IsNullOrWhiteSpace(result.Value));

        emailSender.Verify(
            e => e.SendWelcome(
                "new.user@test.local",
                "new.user",
                ClientBaseUrl,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Register_UsernameTaken_ReturnsUsernameTakenError()
    {
        var existingUser = new UserDbModel
        {
            UserName = "taken.user",
            NormalizedUserName = "TAKEN.USER",
            Email = "existing@test.local",
            NormalizedEmail = "EXISTING@TEST.LOCAL"
        };

        var (service, _, _) = CreateService([existingUser]);

        var result = await service.Register(ValidRegisterModel(username: "taken.user"));

        Assert.True(result.IsFailed);
        Assert.IsType<UsernameTakenError>(result.Errors[0]);
    }

    [Fact]
    public async Task Register_EmailTaken_ReturnsEmailTakenError()
    {
        var existingUser = new UserDbModel
        {
            UserName = "someone.else",
            NormalizedUserName = "SOMEONE.ELSE",
            Email = "taken@test.local",
            NormalizedEmail = "TAKEN@TEST.LOCAL"
        };

        var (service, _, _) = CreateService([existingUser]);

        var result = await service.Register(ValidRegisterModel(email: "taken@test.local"));

        Assert.True(result.IsFailed);
        Assert.IsType<EmailTakenError>(result.Errors[0]);
    }

    [Fact]
    public async Task Register_IdentityValidationFails_ReturnsFailedResultWithIdentityErrorMessage()
    {
        var (service, userManager, _) = CreateService();

        var identityError = new IdentityError
        {
            Code = "PasswordTooShort",
            Description = "Passwords must be at least 8 characters."
        };

        userManager
            .Setup(static m => m.CreateAsync(It.IsAny<UserDbModel>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Failed(identityError));

        var result = await service.Register(ValidRegisterModel());

        Assert.True(result.IsFailed);
        Assert.Contains("Passwords must be at least 8 characters.", result.Errors[0].Message);
    }

    [Fact]
    public async Task Register_WelcomeEmailSendThrows_DeletesUserAndReturnsInvalidRegisterAttemptError()
    {
        var (service, userManager, emailSender) = CreateService();

        userManager
            .Setup(static m => m.CreateAsync(It.IsAny<UserDbModel>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);

        userManager
            .Setup(static m => m.DeleteAsync(It.IsAny<UserDbModel>()))
            .ReturnsAsync(IdentityResult.Success);

        emailSender
            .Setup(static e => e.SendWelcome(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("smtp down"));

        var result = await service.Register(ValidRegisterModel());

        Assert.True(result.IsFailed);
        Assert.IsType<InvalidRegisterAttemptError>(result.Errors[0]);

        userManager.Verify(static m => m.DeleteAsync(It.IsAny<UserDbModel>()), Times.Once);
    }

    [Fact]
    public async Task Register_ClientBaseUrlNotConfigured_DeletesUserAndReturnsInvalidRegisterAttemptError()
    {
        var (service, userManager, _) = CreateService(clientBaseUrl: null);

        userManager
            .Setup(static m => m.CreateAsync(It.IsAny<UserDbModel>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);

        userManager
            .Setup(static m => m.DeleteAsync(It.IsAny<UserDbModel>()))
            .ReturnsAsync(IdentityResult.Success);

        var result = await service.Register(ValidRegisterModel());

        Assert.True(result.IsFailed);
        Assert.IsType<InvalidRegisterAttemptError>(result.Errors[0]);
    }

    #endregion

    #region Login

    [Fact]
    public async Task Login_ValidCredentials_ReturnsSuccessWithJwt()
    {
        var user = new UserDbModel { Id = "1", UserName = "john", Email = "john@test.local" };
        var (service, userManager, _) = CreateService();

        userManager.Setup(m => m.FindByNameAsync("john")).ReturnsAsync(user);
        userManager.Setup(m => m.IsLockedOutAsync(user)).ReturnsAsync(false);
        userManager.Setup(m => m.CheckPasswordAsync(user, "Password123")).ReturnsAsync(true);
        userManager.Setup(m => m.ResetAccessFailedCountAsync(user)).ReturnsAsync(IdentityResult.Success);
        userManager.Setup(m => m.IsInRoleAsync(user, AdminRoleName)).ReturnsAsync(false);

        var result = await service.Login(new LoginServiceModel("john", "Password123", false));

        Assert.True(result.IsSuccess);
        Assert.False(string.IsNullOrWhiteSpace(result.Value));
    }

    [Fact]
    public async Task Login_WrongPassword_ReturnsInvalidLoginAttemptError()
    {
        var user = new UserDbModel { Id = "1", UserName = "john", Email = "john@test.local" };
        var (service, userManager, _) = CreateService();

        userManager.Setup(m => m.FindByNameAsync("john")).ReturnsAsync(user);
        userManager.Setup(m => m.IsLockedOutAsync(user)).ReturnsAsync(false);
        userManager.Setup(m => m.CheckPasswordAsync(user, "wrong-password")).ReturnsAsync(false);
        userManager.Setup(m => m.AccessFailedAsync(user)).ReturnsAsync(IdentityResult.Success);

        var result = await service.Login(new LoginServiceModel("john", "wrong-password", false));

        Assert.True(result.IsFailed);
        Assert.IsType<InvalidLoginAttemptError>(result.Errors[0]);
    }

    [Fact]
    public async Task Login_AccountAlreadyLockedOut_ReturnsAccountIsLockedError()
    {
        var user = new UserDbModel { Id = "1", UserName = "john", Email = "john@test.local" };
        var (service, userManager, _) = CreateService();

        userManager.Setup(m => m.FindByNameAsync("john")).ReturnsAsync(user);
        userManager.Setup(m => m.IsLockedOutAsync(user)).ReturnsAsync(true);

        var result = await service.Login(new LoginServiceModel("john", "Password123", false));

        Assert.True(result.IsFailed);
        Assert.IsType<AccountIsLockedError>(result.Errors[0]);

        userManager.Verify(m => m.CheckPasswordAsync(It.IsAny<UserDbModel>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task Login_NonExistentUser_ReturnsInvalidLoginAttemptError()
    {
        var (service, userManager, _) = CreateService();

        userManager.Setup(m => m.FindByNameAsync("ghost")).ReturnsAsync((UserDbModel?)null);
        userManager.Setup(m => m.FindByEmailAsync("ghost")).ReturnsAsync((UserDbModel?)null);

        var result = await service.Login(new LoginServiceModel("ghost", "Password123", false));

        Assert.True(result.IsFailed);
        Assert.IsType<InvalidLoginAttemptError>(result.Errors[0]);
    }

    [Fact]
    public async Task Login_WrongPasswordTriggersLockout_ReturnsAccountWasLockedError()
    {
        var user = new UserDbModel { Id = "1", UserName = "john", Email = "john@test.local" };
        var (service, userManager, _) = CreateService();

        userManager.Setup(m => m.FindByNameAsync("john")).ReturnsAsync(user);
        userManager
            .SetupSequence(m => m.IsLockedOutAsync(user))
            .ReturnsAsync(false)
            .ReturnsAsync(true);
        userManager.Setup(m => m.CheckPasswordAsync(user, "wrong-password")).ReturnsAsync(false);
        userManager.Setup(m => m.AccessFailedAsync(user)).ReturnsAsync(IdentityResult.Success);

        var result = await service.Login(new LoginServiceModel("john", "wrong-password", false));

        Assert.True(result.IsFailed);
        Assert.IsType<AccountWasLockedError>(result.Errors[0]);
    }

    [Fact]
    public async Task Login_DeletedUser_ReturnsInvalidLoginAttemptError()
    {
        var user = new UserDbModel
        {
            Id = "1",
            UserName = "deleted.user",
            Email = "deleted.user@test.local",
            IsDeleted = true
        };

        var (service, userManager, _) = CreateService();

        userManager.Setup(m => m.FindByNameAsync("deleted.user")).ReturnsAsync(user);

        var result = await service.Login(new LoginServiceModel("deleted.user", "Password123", false));

        Assert.True(result.IsFailed);
        Assert.IsType<InvalidLoginAttemptError>(result.Errors[0]);

        userManager.Verify(m => m.IsLockedOutAsync(It.IsAny<UserDbModel>()), Times.Never);
    }

    #endregion

    #region ForgotPassword

    [Fact]
    public async Task ForgotPassword_UnknownEmail_ReturnsGenericMessageWithoutSendingEmail()
    {
        var (service, userManager, emailSender) = CreateService();

        userManager.Setup(m => m.FindByEmailAsync("missing@test.local")).ReturnsAsync((UserDbModel?)null);

        var result = await service.ForgotPassword(new ForgotPasswordServiceModel("missing@test.local"));

        Assert.True(result.IsSuccess);

        emailSender.Verify(
            e => e.SendPasswordReset(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ForgotPassword_KnownEmail_SendsResetEmailAndReturnsGenericMessage()
    {
        var user = new UserDbModel { Id = "1", UserName = "john", Email = "john@test.local" };
        var (service, userManager, emailSender) = CreateService();

        userManager.Setup(m => m.FindByEmailAsync("john@test.local")).ReturnsAsync(user);
        userManager.Setup(m => m.GeneratePasswordResetTokenAsync(user)).ReturnsAsync("raw-token");

        var result = await service.ForgotPassword(new ForgotPasswordServiceModel("john@test.local"));

        Assert.True(result.IsSuccess);

        emailSender.Verify(
            e => e.SendPasswordReset(
                "john@test.local",
                It.Is<string>(url => url.Contains("token=") && url.Contains("email=")),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ForgotPassword_DeletedUser_ReturnsGenericMessageWithoutSendingEmail()
    {
        var user = new UserDbModel
        {
            Id = "1",
            UserName = "john",
            Email = "john@test.local",
            IsDeleted = true
        };

        var (service, userManager, emailSender) = CreateService();

        userManager.Setup(m => m.FindByEmailAsync("john@test.local")).ReturnsAsync(user);

        var result = await service.ForgotPassword(new ForgotPasswordServiceModel("john@test.local"));

        Assert.True(result.IsSuccess);

        emailSender.Verify(
            e => e.SendPasswordReset(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ForgotPassword_EmailSendThrows_StillReturnsGenericMessage()
    {
        var user = new UserDbModel { Id = "1", UserName = "john", Email = "john@test.local" };
        var (service, userManager, emailSender) = CreateService();

        userManager.Setup(m => m.FindByEmailAsync("john@test.local")).ReturnsAsync(user);
        userManager.Setup(m => m.GeneratePasswordResetTokenAsync(user)).ReturnsAsync("raw-token");

        emailSender
            .Setup(e => e.SendPasswordReset(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("smtp down"));

        var result = await service.ForgotPassword(new ForgotPasswordServiceModel("john@test.local"));

        Assert.True(result.IsSuccess);
    }

    #endregion

    #region ResetPassword

    [Fact]
    public async Task ResetPassword_ValidToken_ReturnsSuccessMessage()
    {
        var user = new UserDbModel { Id = "1", UserName = "john", Email = "john@test.local" };
        var (service, userManager, _) = CreateService();

        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes("raw-token"));

        userManager.Setup(m => m.FindByEmailAsync("john@test.local")).ReturnsAsync(user);
        userManager
            .Setup(m => m.ResetPasswordAsync(user, "raw-token", "NewPassword123"))
            .ReturnsAsync(IdentityResult.Success);

        var result = await service.ResetPassword(
            new ResetPasswordServiceModel("john@test.local", encodedToken, "NewPassword123"));

        Assert.True(result.IsSuccess);
        Assert.Equal("Password successfully reset.", result.Value);
    }

    [Fact]
    public async Task ResetPassword_UnknownEmail_ReturnsInvalidPasswordResetAttemptError()
    {
        var (service, userManager, _) = CreateService();

        userManager.Setup(m => m.FindByEmailAsync("missing@test.local")).ReturnsAsync((UserDbModel?)null);

        var result = await service.ResetPassword(
            new ResetPasswordServiceModel("missing@test.local", "some-token", "NewPassword123"));

        Assert.True(result.IsFailed);
        Assert.IsType<InvalidPasswordResetAttemptError>(result.Errors[0]);
    }

    [Fact]
    public async Task ResetPassword_DeletedUser_ReturnsInvalidPasswordResetAttemptError()
    {
        var user = new UserDbModel
        {
            Id = "1",
            UserName = "john",
            Email = "john@test.local",
            IsDeleted = true
        };

        var (service, userManager, _) = CreateService();

        userManager.Setup(m => m.FindByEmailAsync("john@test.local")).ReturnsAsync(user);

        var result = await service.ResetPassword(
            new ResetPasswordServiceModel("john@test.local", "some-token", "NewPassword123"));

        Assert.True(result.IsFailed);
        Assert.IsType<InvalidPasswordResetAttemptError>(result.Errors[0]);
    }

    [Fact]
    public async Task ResetPassword_MalformedToken_ReturnsInvalidPasswordResetAttemptError()
    {
        var user = new UserDbModel { Id = "1", UserName = "john", Email = "john@test.local" };
        var (service, userManager, _) = CreateService();

        userManager.Setup(m => m.FindByEmailAsync("john@test.local")).ReturnsAsync(user);

        var result = await service.ResetPassword(
            new ResetPasswordServiceModel("john@test.local", "not a valid base64url token!!", "NewPassword123"));

        Assert.True(result.IsFailed);
        Assert.IsType<InvalidPasswordResetAttemptError>(result.Errors[0]);
    }

    [Fact]
    public async Task ResetPassword_IdentityResetFails_ReturnsInvalidPasswordResetAttemptErrorWithIdentityMessage()
    {
        var user = new UserDbModel { Id = "1", UserName = "john", Email = "john@test.local" };
        var (service, userManager, _) = CreateService();

        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes("raw-token"));
        var identityError = new IdentityError { Code = "PasswordMismatch", Description = "Incorrect password." };

        userManager.Setup(m => m.FindByEmailAsync("john@test.local")).ReturnsAsync(user);
        userManager
            .Setup(m => m.ResetPasswordAsync(user, "raw-token", "weak"))
            .ReturnsAsync(IdentityResult.Failed(identityError));

        var result = await service.ResetPassword(
            new ResetPasswordServiceModel("john@test.local", encodedToken, "weak"));

        Assert.True(result.IsFailed);
        var error = Assert.IsType<InvalidPasswordResetAttemptError>(result.Errors[0]);
        Assert.Contains("Incorrect password.", error.Message);
    }

    #endregion
}

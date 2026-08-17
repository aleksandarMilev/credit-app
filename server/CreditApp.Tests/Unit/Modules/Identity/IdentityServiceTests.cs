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

internal sealed record ServiceUnderTest(
    IdentityService Service,
    Mock<UserManager<UserDbModel>> UserManager,
    Mock<IEmailSender> EmailSender);

public class IdentityServiceTests
{
    private const string ClientBaseUrl = "http://localhost:5173";

    [Fact]
    public async Task Login_ValidCredentials_ReturnsSuccessWithJwt()
    {
        var user = new UserDbModel
        {
            Id = "1",
            UserName = "john",
            Email = "john@test.local"
        };

        var (service, userManager, _) = CreateService();

        userManager
            .Setup(static m => m.FindByNameAsync("john"))
            .ReturnsAsync(user);

        userManager
            .Setup(m => m.IsLockedOutAsync(user))
            .ReturnsAsync(false);

        userManager
            .Setup(m => m.CheckPasswordAsync(user, "Password123"))
            .ReturnsAsync(true);

        userManager
            .Setup(m => m.ResetAccessFailedCountAsync(user))
            .ReturnsAsync(IdentityResult.Success);

        userManager
            .Setup(m => m.GetRolesAsync(user))
            .ReturnsAsync([ApproverRoleName]);

        var loginServiceModel = new LoginServiceModel(
            "john",
            "Password123",
            false);

        var result = await service.Login(loginServiceModel);

        Assert.True(result.IsSuccess);
        Assert.False(string.IsNullOrWhiteSpace(result.Value));
    }

    [Fact]
    public async Task Login_UserHasNoRoles_ReturnsNoRoleAssignedError()
    {
        var user = new UserDbModel
        {
            Id = "1",
            UserName = "john",
            Email = "john@test.local"
        };

        var (service, userManager, _) = CreateService();

        userManager
            .Setup(static m => m.FindByNameAsync("john"))
            .ReturnsAsync(user);

        userManager
            .Setup(m => m.IsLockedOutAsync(user))
            .ReturnsAsync(false);

        userManager
            .Setup(m => m.CheckPasswordAsync(user, "Password123"))
            .ReturnsAsync(true);

        userManager
            .Setup(m => m.ResetAccessFailedCountAsync(user))
            .ReturnsAsync(IdentityResult.Success);

        userManager
            .Setup(m => m.GetRolesAsync(user))
            .ReturnsAsync([]);

        var loginServiceModel = new LoginServiceModel(
            "john",
            "Password123",
            false);

        var result = await service.Login(loginServiceModel);

        Assert.True(result.IsFailed);
        Assert.IsType<NoRoleAssignedError>(result.Errors[0]);
    }

    [Fact]
    public async Task Login_WrongPassword_ReturnsInvalidLoginAttemptError()
    {
        var user = new UserDbModel
        {
            Id = "1",
            UserName = "john",
            Email = "john@test.local"
        };

        var (service, userManager, _) = CreateService();

        userManager
            .Setup(m => m.FindByNameAsync("john"))
            .ReturnsAsync(user);

        userManager
            .Setup(m => m.IsLockedOutAsync(user))
            .ReturnsAsync(false);

        userManager
            .Setup(m => m.CheckPasswordAsync(user, "wrong-password"))
            .ReturnsAsync(false);

        userManager
            .Setup(m => m.AccessFailedAsync(user))
            .ReturnsAsync(IdentityResult.Success);

        var loginServiceModel = new LoginServiceModel(
            "john",
            "wrong-password",
            false);

        var result = await service.Login(loginServiceModel);

        Assert.True(result.IsFailed);
        Assert.IsType<InvalidLoginAttemptError>(result.Errors[0]);
    }

    [Fact]
    public async Task Login_AccountAlreadyLockedOut_ReturnsAccountIsLockedError()
    {
        var user = new UserDbModel
        {
            Id = "1",
            UserName = "john",
            Email = "john@test.local"
        };

        var (service, userManager, _) = CreateService();

        userManager
            .Setup(m => m.FindByNameAsync("john"))
            .ReturnsAsync(user);

        userManager
            .Setup(m => m.IsLockedOutAsync(user))
            .ReturnsAsync(true);

        var loginServiceModel = new LoginServiceModel(
            "john",
            "Password123",
            false);

        var result = await service.Login(loginServiceModel);

        Assert.True(result.IsFailed);
        Assert.IsType<AccountIsLockedError>(result.Errors[0]);

        userManager.Verify(
            m => m.CheckPasswordAsync(It.IsAny<UserDbModel>(), It.IsAny<string>()),
            Times.Never);
    }

    [Fact]
    public async Task Login_NonExistentUser_ReturnsInvalidLoginAttemptError()
    {
        var (service, userManager, _) = CreateService();

        userManager
            .Setup(m => m.FindByNameAsync("ghost"))
            .ReturnsAsync((UserDbModel?)null);

        userManager
            .Setup(m => m.FindByEmailAsync("ghost"))
            .ReturnsAsync((UserDbModel?)null);

        var loginServiceModel = new LoginServiceModel(
            "ghost",
            "Password123",
            false);

        var result = await service.Login(loginServiceModel);

        Assert.True(result.IsFailed);
        Assert.IsType<InvalidLoginAttemptError>(result.Errors[0]);
    }

    [Fact]
    public async Task Login_WrongPasswordTriggersLockout_ReturnsAccountWasLockedError()
    {
        var user = new UserDbModel
        {
            Id = "1",
            UserName = "john",
            Email = "john@test.local"
        };

        var (service, userManager, _) = CreateService();

        userManager
            .Setup(m => m.FindByNameAsync("john"))
            .ReturnsAsync(user);

        userManager
            .SetupSequence(m => m.IsLockedOutAsync(user))
            .ReturnsAsync(false)
            .ReturnsAsync(true);

        userManager
            .Setup(m => m.CheckPasswordAsync(user, "wrong-password"))
            .ReturnsAsync(false);

        userManager
            .Setup(m => m.AccessFailedAsync(user))
            .ReturnsAsync(IdentityResult.Success);

        var loginServiceModel = new LoginServiceModel(
            "john",
            "wrong-password",
            false);

        var result = await service.Login(loginServiceModel);

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

        userManager
            .Setup(m => m.FindByNameAsync("deleted.user"))
            .ReturnsAsync(user);

        var loginServiceModel = new LoginServiceModel(
            "deleted.user",
            "Password123",
            false);

        var result = await service.Login(loginServiceModel);

        Assert.True(result.IsFailed);
        Assert.IsType<InvalidLoginAttemptError>(result.Errors[0]);

        userManager.Verify(
            m => m.IsLockedOutAsync(It.IsAny<UserDbModel>()),
            Times.Never);
    }

    [Fact]
    public async Task ForgotPassword_UnknownEmail_ReturnsGenericMessageWithoutSendingEmail()
    {
        var (service, userManager, emailSender) = CreateService();

        userManager
            .Setup(m => m.FindByEmailAsync("missing@test.local"))
            .ReturnsAsync((UserDbModel?)null);

        var forgotPasswordServiceModel = new ForgotPasswordServiceModel("missing@test.local");

        var result = await service.ForgotPassword(forgotPasswordServiceModel);

        Assert.True(result.IsSuccess);

        emailSender.Verify(
            e => e.SendPasswordReset(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ForgotPassword_KnownEmail_SendsResetEmailAndReturnsGenericMessage()
    {
        var user = new UserDbModel
        {
            Id = "1",
            UserName = "john",
            Email = "john@test.local"
        };

        var (service, userManager, emailSender) = CreateService();

        userManager
            .Setup(m => m.FindByEmailAsync("john@test.local"))
            .ReturnsAsync(user);

        userManager
            .Setup(m => m.GeneratePasswordResetTokenAsync(user))
            .ReturnsAsync("raw-token");

        var forgotPasswordServiceModel = new ForgotPasswordServiceModel("john@test.local");

        var result = await service.ForgotPassword(forgotPasswordServiceModel);

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

        userManager
            .Setup(m => m.FindByEmailAsync("john@test.local"))
            .ReturnsAsync(user);

        var forgotPasswordServiceModel = new ForgotPasswordServiceModel("john@test.local");

        var result = await service.ForgotPassword(forgotPasswordServiceModel);

        Assert.True(result.IsSuccess);

        emailSender.Verify(
            e => e.SendPasswordReset(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ForgotPassword_EmailSendThrows_StillReturnsGenericMessage()
    {
        var user = new UserDbModel
        {
            Id = "1",
            UserName = "john",
            Email = "john@test.local"
        };

        var (service, userManager, emailSender) = CreateService();

        userManager
            .Setup(m => m.FindByEmailAsync("john@test.local"))
            .ReturnsAsync(user);

        userManager
            .Setup(m => m.GeneratePasswordResetTokenAsync(user))
            .ReturnsAsync("raw-token");

        emailSender
            .Setup(e => e.SendPasswordReset(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("smtp down"));

        var forgotPasswordServiceModel = new ForgotPasswordServiceModel("john@test.local");

        var result = await service.ForgotPassword(forgotPasswordServiceModel);

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public async Task ResetPassword_ValidToken_ReturnsSuccessMessage()
    {
        var user = new UserDbModel
        {
            Id = "1",
            UserName = "john",
            Email = "john@test.local"
        };

        var (service, userManager, _) = CreateService();

        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes("raw-token"));

        userManager
            .Setup(m => m.FindByEmailAsync("john@test.local"))
            .ReturnsAsync(user);

        userManager
            .Setup(m => m.ResetPasswordAsync(user, "raw-token", "NewPassword123"))
            .ReturnsAsync(IdentityResult.Success);

        var resetPasswordServiceModel = new ResetPasswordServiceModel(
            "john@test.local",
            encodedToken,
            "NewPassword123");

        var result = await service.ResetPassword(resetPasswordServiceModel);

        Assert.True(result.IsSuccess);
        Assert.Equal("Password successfully reset.", result.Value);
    }

    [Fact]
    public async Task ResetPassword_UnknownEmail_ReturnsInvalidPasswordResetAttemptError()
    {
        var (service, userManager, _) = CreateService();

        userManager
            .Setup(m => m.FindByEmailAsync("missing@test.local"))
            .ReturnsAsync((UserDbModel?)null);

        var resetPasswordServiceModel = new ResetPasswordServiceModel(
            "missing@test.local",
            "some-token",
            "NewPassword123");

        var result = await service.ResetPassword(resetPasswordServiceModel);

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

        userManager
            .Setup(m => m.FindByEmailAsync("john@test.local"))
            .ReturnsAsync(user);

        var resetPasswordServiceModel = new ResetPasswordServiceModel(
            "john@test.local",
            "some-token",
            "NewPassword123");

        var result = await service.ResetPassword(resetPasswordServiceModel);

        Assert.True(result.IsFailed);
        Assert.IsType<InvalidPasswordResetAttemptError>(result.Errors[0]);
    }

    [Fact]
    public async Task ResetPassword_MalformedToken_ReturnsInvalidPasswordResetAttemptError()
    {
        var user = new UserDbModel
        {
            Id = "1",
            UserName = "john",
            Email = "john@test.local"
        };

        var (service, userManager, _) = CreateService();

        userManager
            .Setup(m => m.FindByEmailAsync("john@test.local"))
            .ReturnsAsync(user);

        var resetPasswordServiceModel = new ResetPasswordServiceModel(
            "john@test.local",
            "not a valid base64url token!!",
            "NewPassword123");

        var result = await service.ResetPassword(resetPasswordServiceModel);

        Assert.True(result.IsFailed);
        Assert.IsType<InvalidPasswordResetAttemptError>(result.Errors[0]);
    }

    [Fact]
    public async Task ResetPassword_IdentityResetFails_ReturnsInvalidPasswordResetAttemptErrorWithIdentityMessage()
    {
        var user = new UserDbModel
        {
            Id = "1",
            UserName = "john",
            Email = "john@test.local"
        };

        var (service, userManager, _) = CreateService();

        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes("raw-token"));

        var identityError = new IdentityError
        {
            Code = "PasswordMismatch",
            Description = "Incorrect password."
        };

        userManager
            .Setup(m => m.FindByEmailAsync("john@test.local"))
            .ReturnsAsync(user);

        userManager
            .Setup(m => m.ResetPasswordAsync(user, "raw-token", "weak"))
            .ReturnsAsync(IdentityResult.Failed(identityError));

        var resetPasswordServiceModel = new ResetPasswordServiceModel(
            "john@test.local",
            encodedToken,
            "weak");

        var result = await service.ResetPassword(resetPasswordServiceModel);

        Assert.True(result.IsFailed);

        var error = Assert.IsType<InvalidPasswordResetAttemptError>(result.Errors[0]);
        Assert.Contains("Incorrect password.", error.Message);
    }

    private static ServiceUnderTest CreateService(
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

        var appUrls = new AppUrlsSettings
        {
            ClientBaseUrl = clientBaseUrl!
        };

        var appUrlsSettings = Options.Create(appUrls);

        var service = new IdentityService(
            userManagerMock.Object,
            emailSenderMock.Object,
            NullLogger<IdentityService>.Instance,
            jwtSettings,
            appUrlsSettings);

        return new(
            service,
            userManagerMock,
            emailSenderMock);
    }
}

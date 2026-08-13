namespace CreditApp.Modules.Identity.Service;

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CreditApp.Shared.Settings;
using Data.Models;
using Email;
using FluentResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Models;
using Shared.Errors;

using static CreditApp.Shared.Constants.Names;
using static Shared.Constants.TokenExpiration;

public class IdentityService(
    UserManager<UserDbModel> userManager,
    IEmailSender emailSender,
    ILogger<IdentityService> logger,
    IOptions<JwtSettings> jwtSettings,
    IOptions<AppUrlsSettings> appUrlsSettings) : IIdentityService
{
    public async Task<Result<string>> Register(
        RegisterServiceModel serviceModel,
        CancellationToken cancellationToken = default)
    {
        var normalizedUsername = userManager.NormalizeName(serviceModel.Username);
        var normalizedEmail = userManager.NormalizeEmail(serviceModel.Email);

        var usersQuery = userManager.Users;
        usersQuery = usersQuery.IgnoreQueryFilters();

        var usernameTaken = await usersQuery
            .AnyAsync(
                u => u.NormalizedUserName == normalizedUsername,
                cancellationToken);

        if (usernameTaken)
        {
            return Result.Fail<string>(
                new UsernameTakenError(serviceModel.Username));
        }

        var emailTaken = await usersQuery
            .AnyAsync(
                u => u.NormalizedEmail == normalizedEmail,
                cancellationToken);

        if (emailTaken)
        {
            return Result.Fail<string>(
                new EmailTakenError(serviceModel.Username));
        }

        var user = new UserDbModel
        {
            Email = serviceModel.Email,
            UserName = serviceModel.Username,
            FirstName = serviceModel.FirstName,
            LastName = serviceModel.LastName,
            DateOfBirth = serviceModel.DateOfBirth,
            LockoutEnabled = true
        };

        var identityResult = await userManager.CreateAsync(
            user,
            serviceModel.Password);

        if (identityResult.Succeeded)
        {
            try
            {
                var jwt = this.GenerateJwtToken(
                    jwtSettings.Value.Secret,
                    user.Id,
                    serviceModel.Username,
                    serviceModel.Email);

                logger.LogInformation("User successfully registered. UserId={UserId}", user.Id);

                var baseUrl = appUrlsSettings
                    .Value
                    .ClientBaseUrl?
                    .TrimEnd('/')
                    ?? throw new InvalidOperationException("AppUrlsSettings:ClientBaseUrl is not configured.");

                await emailSender.SendWelcome(
                    serviceModel.Email,
                    serviceModel.Username,
                    baseUrl,
                    cancellationToken);

                return Result.Ok(jwt);
            }
            catch (Exception exception)
            {
                logger.LogError(exception,
                    "Failed to complete registration. UserId={UserId}",
                    user.Id);

                await userManager.DeleteAsync(user);

                return Result.Fail<string>(
                   new InvalidRegisterAttemptError());
            }
        }

        var errorMessage = string.Join(
            "; ",
            identityResult.Errors.Select(static e => e.Description));

        return Result.Fail<string>(errorMessage);
    }

    public async Task<Result<string>> Login(
        LoginServiceModel serviceModel,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager
            .FindByNameAsync(serviceModel.Credentials);

        if (user is null)
        {
            user = await userManager.FindByEmailAsync(
                serviceModel.Credentials);

            if (user is null)
            {
                return Result.Fail<string>(
                    new InvalidLoginAttemptError());
            }
        }

        if (user.IsDeleted)
        {
            return Result.Fail<string>(
                new InvalidLoginAttemptError());
        }

        if (await userManager.IsLockedOutAsync(user))
        {
            return Result.Fail<string>(
                new AccountIsLockedError());
        }

        var passwordIsValid = await userManager.CheckPasswordAsync(
            user,
            serviceModel.Password);

        if (passwordIsValid)
        {
            await userManager.ResetAccessFailedCountAsync(user);

            var isAdmin = await userManager.IsInRoleAsync(user, AdminRoleName);
            var jwt = this.GenerateJwtToken(
                jwtSettings.Value.Secret,
                user.Id,
                user.UserName!,
                user.Email!,
                serviceModel.RememberMe,
                isAdmin);

            return Result.Ok(jwt);
        }

        await userManager.AccessFailedAsync(user);

        if (await userManager.IsLockedOutAsync(user))
        {
            return Result.Fail(
                new AccountWasLockedError());
        }

        return Result.Fail<string>(new InvalidLoginAttemptError());
    }

    public async Task<Result<string>> ForgotPassword(
        ForgotPasswordServiceModel serviceModel,
        CancellationToken cancellationToken = default)
    {
        const string GenericMessage =
            "If an account exists for that email, a password reset link has been sent.";

        var user = await userManager.FindByEmailAsync(serviceModel.Email);

        if (user is null || user.IsDeleted)
        {
            return Result.Ok(GenericMessage);
        }

        try
        {
            var token = await userManager.GeneratePasswordResetTokenAsync(user);
            var encodedToken = WebEncoders.Base64UrlEncode(
                Encoding.UTF8.GetBytes(token));

            var baseUrl = appUrlsSettings
                .Value
                .ClientBaseUrl?
                .TrimEnd('/')
                ?? throw new InvalidOperationException("AppUrlsSettings:ClientBaseUrl is not configured!");

            var resetPath = $"{baseUrl}/identity/reset-password";
            var resetUrl = QueryHelpers.AddQueryString(
                resetPath,
                new Dictionary<string, string?>
                {
                    ["email"] = user.Email,
                    ["token"] = encodedToken
                });

            await emailSender.SendPasswordReset(
                user.Email!,
                resetUrl,
                cancellationToken);

            return Result.Ok(GenericMessage);
        }
        catch (Exception exception)
        {
            logger.LogError(
                exception,
                "Failed generating/sending password reset email. UserId={UserId}",
                user.Id);

            return Result.Ok(GenericMessage);
        }
    }

    public async Task<Result<string>> ResetPassword(
        ResetPasswordServiceModel serviceModel,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByEmailAsync(serviceModel.Email);

        if (user is null || user.IsDeleted)
        {
            return Result.Fail(
                new InvalidPasswordResetAttemptError());
        }

        string token;

        try
        {
            var tokenBytes = WebEncoders.Base64UrlDecode(serviceModel.Token);
            token = Encoding.UTF8.GetString(tokenBytes);
        }
        catch
        {
            return Result.Fail(
                new InvalidPasswordResetAttemptError());
        }

        var result = await userManager.ResetPasswordAsync(
            user,
            token,
            serviceModel.NewPassword);

        if (!result.Succeeded)
        {
            var errorMessage = string.Join(
                "; ",
                result.Errors.Select(static e => e.Description));

            return Result.Fail(
                new InvalidPasswordResetAttemptError(errorMessage));
        }

        return Result.Ok("Password successfully reset.");
    }

    private string GenerateJwtToken(
        string appSettingsSecret,
        string userId,
        string username,
        string email,
        bool rememberMe = false,
        bool isAdmin = false)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        tokenHandler.OutboundClaimTypeMap.Clear();

        var key = Encoding.UTF8.GetBytes(appSettingsSecret);

        var claimList = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Name, username),
            new(ClaimTypes.Email, email)
        };

        if (isAdmin)
        {
            claimList.Add(new(ClaimTypes.Role, AdminRoleName));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claimList),
            Expires = rememberMe
                ? DateTime.UtcNow.AddDays(ExtendedTokenExpirationTime)
                : DateTime.UtcNow.AddDays(DefaultTokenExpirationTime),
            Issuer = jwtSettings.Value.Issuer,
            Audience = jwtSettings.Value.Audience,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }
}

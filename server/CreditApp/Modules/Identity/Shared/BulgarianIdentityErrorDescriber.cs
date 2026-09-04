namespace CreditApp.Modules.Identity.Shared;

using Microsoft.AspNetCore.Identity;

// ASP.NET Core Identity's default IdentityErrorDescriber produces English text
// (e.g. "Passwords must have at least one digit ('0'-'9')."), which flows
// straight through IdentityService.ResetPassword's join of
// result.Errors.Select(e => e.Description) into a client-facing
// InvalidPasswordResetAttemptError message. Overriding the describer fixes
// this at the source — for any current or future caller of UserManager that
// surfaces IdentityResult.Errors — rather than replacing that passthrough
// with one generic Bulgarian message and losing which specific rule failed.
//
// Only the methods actually reachable through this app's only Identity write
// path that surfaces errors to a client (UserManager.ResetPasswordAsync,
// called from IdentityService.ResetPassword) are overridden: its token check
// (InvalidToken) and whichever IPasswordValidator rules are enabled via
// AddIdentity's PasswordOptions (Shared/Extensions/ServiceCollectionExtensions.cs).
// There is no user-creation endpoint in this app (accounts are seeded, not
// self-registered), so the Duplicate*/Invalid(UserName|Email)/role-management
// overrides would never be exercised — they're intentionally left at their
// English defaults rather than translated dead code.
public sealed class BulgarianIdentityErrorDescriber : IdentityErrorDescriber
{
    public override IdentityError PasswordTooShort(int length)
        => new()
        {
            Code = nameof(this.PasswordTooShort),
            Description = $"Паролата трябва да съдържа поне {length} символа."
        };

    public override IdentityError PasswordRequiresNonAlphanumeric()
        => new()
        {
            Code = nameof(this.PasswordRequiresNonAlphanumeric),
            Description = "Паролата трябва да съдържа поне един неалфанумеричен символ."
        };

    public override IdentityError PasswordRequiresDigit()
        => new()
        {
            Code = nameof(this.PasswordRequiresDigit),
            Description = "Паролата трябва да съдържа поне една цифра."
        };

    public override IdentityError PasswordRequiresLower()
        => new()
        {
            Code = nameof(this.PasswordRequiresLower),
            Description = "Паролата трябва да съдържа поне една малка буква."
        };

    public override IdentityError PasswordRequiresUpper()
        => new()
        {
            Code = nameof(this.PasswordRequiresUpper),
            Description = "Паролата трябва да съдържа поне една главна буква."
        };

    public override IdentityError PasswordRequiresUniqueChars(int uniqueChars)
        => new()
        {
            Code = nameof(this.PasswordRequiresUniqueChars),
            Description = $"Паролата трябва да съдържа поне {uniqueChars} различни символа."
        };

    public override IdentityError InvalidToken()
        => new()
        {
            Code = nameof(this.InvalidToken),
            Description = "Невалиден или изтекъл токен."
        };

    public override IdentityError PasswordMismatch()
        => new()
        {
            Code = nameof(this.PasswordMismatch),
            Description = "Грешна парола."
        };
}

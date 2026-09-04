namespace CreditApp.Modules.Identity.Web.Models;

using System.ComponentModel.DataAnnotations;

using static Shared.Constants.Validation;

public class LoginWebModel
{
    [Required(ErrorMessage = "Потребителското име или имейлът е задължителен.")]
    [StringLength(
       CredentialsMaxLength,
       MinimumLength = CredentialsMinLength,
       ErrorMessage = "Потребителското име или имейлът трябва да е между {2} и {1} символа.")]
    public string Credentials { get; init; } = default!;

    [Required(ErrorMessage = "Паролата е задължителна.")]
    [StringLength(
       PasswordMaxLength,
       MinimumLength = PasswordMinLength,
       ErrorMessage = "Паролата трябва да е между {2} и {1} символа.")]
    public string Password { get; init; } = default!;

    public bool RememberMe { get; init; }
}

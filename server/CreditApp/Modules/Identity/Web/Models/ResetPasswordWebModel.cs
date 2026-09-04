namespace CreditApp.Modules.Identity.Web.Models;

using System.ComponentModel.DataAnnotations;

using static Shared.Constants.Validation;

public class ResetPasswordWebModel
{
    [Required(ErrorMessage = "Имейлът е задължителен.")]
    [EmailAddress(ErrorMessage = "Невалиден имейл адрес.")]
    [StringLength(
        EmailMaxLength,
        MinimumLength = EmailMinLength,
        ErrorMessage = "Имейлът трябва да е между {2} и {1} символа.")]
    public string Email { get; init; } = default!;

    [Required(ErrorMessage = "Токенът е задължителен.")]
    public string Token { get; init; } = default!;

    [Required(ErrorMessage = "Новата парола е задължителна.")]
    [StringLength(
        PasswordMaxLength,
        MinimumLength = PasswordMinLength,
        ErrorMessage = "Новата парола трябва да е между {2} и {1} символа.")]
    public string NewPassword { get; init; } = default!;
}

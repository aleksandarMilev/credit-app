namespace CreditApp.Modules.Identity.Web.Models;

using System.ComponentModel.DataAnnotations;

using static Shared.Constants.Validation;

public class ForgotPasswordWebModel
{
    [Required(ErrorMessage = "Имейлът е задължителен.")]
    [EmailAddress(ErrorMessage = "Невалиден имейл адрес.")]
    [StringLength(
        EmailMaxLength,
        MinimumLength = EmailMinLength,
        ErrorMessage = "Имейлът трябва да е между {2} и {1} символа.")]
    public string Email { get; init; } = default!;
}

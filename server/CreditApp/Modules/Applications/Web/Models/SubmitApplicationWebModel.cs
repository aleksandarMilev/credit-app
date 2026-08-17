namespace CreditApp.Modules.Applications.Web.Models;

using System.ComponentModel.DataAnnotations;
using Attributes;
using Microsoft.AspNetCore.Http;

using static Shared.Constants.Validation;

public class SubmitApplicationWebModel
{
    [Required(ErrorMessage = "Името е задължително.")]
    [StringLength(
        NameMaxLength,
        MinimumLength = NameMinLength,
        ErrorMessage = "Името трябва да е между {2} и {1} символа.")]
    public string FirstName { get; init; } = default!;

    [Required(ErrorMessage = "Фамилията е задължителна.")]
    [StringLength(
        NameMaxLength,
        MinimumLength = NameMinLength,
        ErrorMessage = "Фамилията трябва да е между {2} и {1} символа.")]
    public string LastName { get; init; } = default!;

    [Required(ErrorMessage = "ЕГН е задължително.")]
    [ValidEgn(ErrorMessage = "Невалидно ЕГН.")]
    public string Egn { get; init; } = default!;

    [Required(ErrorMessage = "Телефонният номер е задължителен.")]
    [RegularExpression(
        @"^(\+[1-9][0-9]{7,14}|0[0-9]{7,14})$",
        ErrorMessage = "Невалиден телефонен номер.")]
    public string Phone { get; init; } = default!;

    [Required(ErrorMessage = "Имейлът е задължителен.")]
    [EmailAddress(ErrorMessage = "Невалиден имейл адрес.")]
    [StringLength(
        EmailMaxLength,
        MinimumLength = EmailMinLength,
        ErrorMessage = "Имейлът трябва да е между {2} и {1} символа.")]
    public string Email { get; init; } = default!;

    [Required(ErrorMessage = "Желаната сума е задължителна.")]
    [Range(
        typeof(decimal), "1", "1000000",
        ErrorMessage = "Желаната сума трябва да е между {1} и {2} лв.")]
    public decimal RequestedAmount { get; init; }

    [Required(ErrorMessage = "Срокът на кредита е задължителен.")]
    [Range(
        1, 360,
        ErrorMessage = "Срокът на кредита трябва да е между {1} и {2} месеца.")]
    public int RequestedTermMonths { get; init; }

    [Required(ErrorMessage = "Снимката на личната карта е задължителна.")]
    public IFormFile IdCardImage { get; init; } = default!;
}
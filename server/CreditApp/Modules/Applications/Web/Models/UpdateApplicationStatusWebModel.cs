namespace CreditApp.Modules.Applications.Web.Models;

using System.ComponentModel.DataAnnotations;

using static Shared.Constants.Validation;

public class UpdateApplicationStatusWebModel
{
    [Required(ErrorMessage = "Решението е задължително.")]
    public ApplicationDecision Decision { get; init; }

    [StringLength(
        ReviewNoteMaxLength,
        ErrorMessage = "Бележката не може да надвишава {1} символа.")]
    public string? Note { get; init; }
}
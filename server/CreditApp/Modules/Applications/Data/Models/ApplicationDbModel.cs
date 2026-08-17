namespace CreditApp.Modules.Applications.Data.Models;

using CreditApp.Shared.Data.Models.Base;

public class ApplicationDbModel : DeletableEntity<Guid>
{
    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    public string Egn { get; set; } = null!;

    public string Phone { get; set; } = null!;

    public string Email { get; set; } = null!;

    public decimal RequestedAmount { get; set; }

    public int RequestedTermMonths { get; set; }

    public string IdCardImagePath { get; set; } = null!;

    public ApplicationStatus Status { get; set; }

    public string? ReviewNote { get; set; }

    public string? ReviewedBy { get; set; }

    public DateTime? ReviewedOn { get; set; }
}

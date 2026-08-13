namespace CreditApp.Modules.Identity.Data.Models;

using CreditApp.Shared.Data.Models.Base;
using Microsoft.AspNetCore.Identity;

public class UserDbModel :
    IdentityUser,
    IDeletableEntity
{
    public DateTime CreatedOn { get; set; }

    public string? CreatedBy { get; set; }

    public DateTime? ModifiedOn { get; set; }

    public string? ModifiedBy { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime? DeletedOn { get; set; }

    public string? DeletedBy { get; set; }

    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    public DateTime DateOfBirth { get; set; }
}

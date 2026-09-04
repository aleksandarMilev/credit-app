namespace CreditApp.Shared.Data.Models.Base;

public interface IDeletableEntity : IEntity
{
    bool IsDeleted { get; set; }

    DateTime? DeletedOn { get; set; }

    string? DeletedBy { get; set; }
}

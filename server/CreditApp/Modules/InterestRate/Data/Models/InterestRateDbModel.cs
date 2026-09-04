namespace CreditApp.Modules.InterestRate.Data.Models;

using CreditApp.Shared.Data.Models.Base;

public class InterestRateDbModel : Entity<Guid>
{
    public decimal AnnualRatePercent { get; set; }
}

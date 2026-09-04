namespace CreditApp.Modules.InterestRate.Service.Models;

public sealed record InterestRateServiceModel(
    decimal AnnualRatePercent,
    DateTime? ModifiedOn,
    string? ModifiedBy);

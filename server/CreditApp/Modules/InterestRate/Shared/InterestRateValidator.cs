namespace CreditApp.Modules.InterestRate.Shared;

using static Constants.Validation;

public static class InterestRateValidator
{
    public static bool IsValid(decimal annualRatePercent)
        => annualRatePercent > MinAnnualRatePercent &&
           annualRatePercent < MaxAnnualRatePercent;
}

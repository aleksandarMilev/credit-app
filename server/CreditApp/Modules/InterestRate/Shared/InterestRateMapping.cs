namespace CreditApp.Modules.InterestRate.Shared;

using Data.Models;
using Service.Models;
using Web.Models;

public static class InterestRateMapping
{
    public static InterestRateServiceModel ToInterestRateServiceModel(
        this InterestRateDbModel rate)
        => new(
            rate.AnnualRatePercent,
            rate.ModifiedOn,
            rate.ModifiedBy);

    public static UpdateInterestRateServiceModel ToUpdateInterestRateServiceModel(
        this UpdateInterestRateWebModel webModel)
        => new(webModel.AnnualRatePercent);
}

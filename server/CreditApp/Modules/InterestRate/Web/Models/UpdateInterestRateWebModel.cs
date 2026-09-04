namespace CreditApp.Modules.InterestRate.Web.Models;

using System.ComponentModel.DataAnnotations;

public class UpdateInterestRateWebModel
{
    [Range(
        typeof(decimal),
        "0.01",
        "99.99",
        ErrorMessage = "Лихвеният процент трябва да бъде между {1} и {2}.")]

    public decimal AnnualRatePercent { get; init; }
}

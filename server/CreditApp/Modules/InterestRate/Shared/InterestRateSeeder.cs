namespace CreditApp.Modules.InterestRate.Shared;

using CreditApp.Shared.Data;
using Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

public static class InterestRateSeeder
{
    private const decimal DefaultAnnualRatePercent = 9.5m;

    public static async Task SeedIfMissing(
        IServiceProvider services,
        CancellationToken cancellationToken = default)
    {
        var logger = services
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger("SeedInterestRate");

        var data = services.GetRequiredService<CreditAppDbContext>();

        var rateAlreadySeeded = await data
            .InterestRates
            .AnyAsync(cancellationToken);

        if (rateAlreadySeeded)
        {
            logger.LogInformation("Interest rate already seeded — skipping.");

            return;
        }

        var dbModel = new InterestRateDbModel
        {
            AnnualRatePercent = DefaultAnnualRatePercent
        };

        data.InterestRates.Add(dbModel);

        await data.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Seeded default interest rate: {Rate}%.",
            DefaultAnnualRatePercent);
    }
}

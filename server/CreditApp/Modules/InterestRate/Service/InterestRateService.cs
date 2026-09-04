namespace CreditApp.Modules.InterestRate.Service;

using CreditApp.Shared.Data;
using CreditApp.Shared.Services.CurrentUser;
using FluentResults;
using Microsoft.EntityFrameworkCore;
using Models;
using Shared;
using Shared.Errors;

using static Shared.Constants.Validation;

public class InterestRateService(
    CreditAppDbContext data,
    ICurrentUserService currentUser) : IInterestRateService
{
    public async Task<Result<InterestRateServiceModel>> GetCurrentRate(
        CancellationToken cancellationToken = default)
    {
        var rate = await data
            .InterestRates
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);

        if (rate is null)
        {
            return Result.Fail<InterestRateServiceModel>(
                new InterestRateNotConfiguredError());
        }

        return Result.Ok(rate.ToInterestRateServiceModel());
    }

    public async Task<Result<InterestRateServiceModel>> UpdateRate(
         UpdateInterestRateServiceModel serviceModel,
         CancellationToken cancellationToken = default)
    {
        if (!InterestRateValidator.IsValid(serviceModel.AnnualRatePercent))
        {
            return Result.Fail<InterestRateServiceModel>(
                new InvalidInterestRateError(
                    $"Лихвеният процент трябва да бъде между {MinAnnualRatePercent} и {MaxAnnualRatePercent}."));
        }

        var modifiedOn = DateTime.UtcNow;
        var modifiedBy = currentUser.GetUsername();

        var affectedRows = await data
            .InterestRates
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(
                        r => r.AnnualRatePercent,
                        serviceModel.AnnualRatePercent)
                    .SetProperty(r => r.ModifiedOn, modifiedOn)
                    .SetProperty(r => r.ModifiedBy, modifiedBy),
                cancellationToken);

        if (affectedRows == 0)
        {
            return Result.Fail<InterestRateServiceModel>(
                new InterestRateNotConfiguredError());
        }

        return await this.GetCurrentRate(cancellationToken);
    }
}

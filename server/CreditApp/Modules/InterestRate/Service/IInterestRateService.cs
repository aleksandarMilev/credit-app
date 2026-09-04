namespace CreditApp.Modules.InterestRate.Service;

using CreditApp.Shared.Services.ServiceLifetimes;
using FluentResults;
using Models;

public interface IInterestRateService : IScopedService
{
    Task<Result<InterestRateServiceModel>> GetCurrentRate(
        CancellationToken cancellationToken = default);

    Task<Result<InterestRateServiceModel>> UpdateRate(
        UpdateInterestRateServiceModel serviceModel,
        CancellationToken cancellationToken = default);
}

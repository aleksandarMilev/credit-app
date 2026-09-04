namespace CreditApp.Modules.Identity.Service;

using CreditApp.Shared.Services.ServiceLifetimes;
using FluentResults;
using Models;

public interface IIdentityService : ITransientService
{
    Task<Result<string>> Login(
        LoginServiceModel model,
        CancellationToken cancellationToken = default);

    Task<Result<string>> ForgotPassword(
        ForgotPasswordServiceModel model,
        CancellationToken cancellationToken = default);

    Task<Result<string>> ResetPassword(
        ResetPasswordServiceModel model,
        CancellationToken cancellationToken = default);
}

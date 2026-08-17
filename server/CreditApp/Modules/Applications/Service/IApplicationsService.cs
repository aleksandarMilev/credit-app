namespace CreditApp.Modules.Applications.Service;

using CreditApp.Shared.Models;
using CreditApp.Shared.Services.ServiceLifetimes;
using FluentResults;
using Models;

public interface IApplicationsService : IScopedService
{
    Task<Result<PagedResult<ApplicationSummaryServiceModel>>> GetAll(
        GetApplicationsQueryServiceModel query,
        CancellationToken cancellationToken = default);

    Task<Result<ApplicationDetailServiceModel>> GetById(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<Result<ApplicationDocumentServiceModel>> GetDocument(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<Result<Guid>> Submit(
        SubmitApplicationServiceModel serviceModel,
        CancellationToken cancellationToken = default);

    Task<Result<ApplicationDetailServiceModel>> UpdateStatus(
        UpdateApplicationStatusServiceModel serviceModel,
        CancellationToken cancellationToken = default);
}

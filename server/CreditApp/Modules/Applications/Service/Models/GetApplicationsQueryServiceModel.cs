namespace CreditApp.Modules.Applications.Service.Models;

using Data.Models;

public sealed record GetApplicationsQueryServiceModel(
    int PageIndex,
    int PageSize,
    ApplicationStatus? Status);

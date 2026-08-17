namespace CreditApp.Modules.Applications.Service.Models;

using Data.Models;

public sealed record UpdateApplicationStatusServiceModel(
    Guid ApplicationId,
    ApplicationStatus Status,
    string? Note,
    string ReviewedByUsername);

namespace CreditApp.Modules.Applications.Service.Models;

using Data.Models;

public sealed record ApplicationSummaryServiceModel(
    Guid Id,
    string FirstName,
    string LastName,
    decimal RequestedAmount,
    int RequestedTermMonths,
    ApplicationStatus Status,
    DateTime CreatedOn);

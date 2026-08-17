namespace CreditApp.Modules.Applications.Service.Models;

using Data.Models;

public sealed record ApplicationDetailServiceModel(
    Guid Id,
    string FirstName,
    string LastName,
    string Egn,
    string Phone,
    string Email,
    decimal RequestedAmount,
    int RequestedTermMonths,
    ApplicationStatus Status,
    string? ReviewNote,
    string? ReviewedBy,
    DateTime? ReviewedOn,
    DateTime CreatedOn);

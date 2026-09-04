namespace CreditApp.Modules.Applications.Service.Models;

public sealed record SubmitApplicationServiceModel(
    string FirstName,
    string LastName,
    string Egn,
    string Phone,
    string Email,
    decimal RequestedAmount,
    int RequestedTermMonths,
    Stream IdCardImageContent,
    string IdCardImageContentType,
    string IdCardImageFileName,
    long IdCardImageSizeBytes);

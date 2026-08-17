namespace CreditApp.Modules.Applications.Service.Models;

public sealed record ApplicationDocumentServiceModel(
    Stream Content,
    string ContentType,
    string FileName);

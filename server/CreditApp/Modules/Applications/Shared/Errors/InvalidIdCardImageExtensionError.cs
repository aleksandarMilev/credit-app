namespace CreditApp.Modules.Applications.Shared.Errors;

using FluentResults;

public sealed class InvalidIdCardImageExtensionError()
    : Error("Невалиден формат на файла. Позволени формати: JPG, JPEG, PNG.")
{ }

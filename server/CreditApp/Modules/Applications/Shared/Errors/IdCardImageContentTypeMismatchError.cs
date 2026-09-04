namespace CreditApp.Modules.Applications.Shared.Errors;

using FluentResults;

public sealed class IdCardImageContentTypeMismatchError()
    : Error("Типът на файла не съответства на неговото разширение.")
{ }

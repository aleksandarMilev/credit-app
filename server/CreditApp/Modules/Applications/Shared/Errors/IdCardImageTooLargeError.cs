namespace CreditApp.Modules.Applications.Shared.Errors;

using FluentResults;

public sealed class IdCardImageTooLargeError(string message)
    : Error(message)
{ }

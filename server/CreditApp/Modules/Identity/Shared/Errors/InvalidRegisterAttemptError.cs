namespace CreditApp.Modules.Identity.Shared.Errors;

using FluentResults;

public sealed class InvalidRegisterAttemptError(
    string message = "Invalid register attempt!") : Error(message)
{ }

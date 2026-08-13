namespace CreditApp.Modules.Identity.Shared.Errors;

using FluentResults;

public sealed class InvalidLoginAttemptError(
    string message = "Invalid login attempt!") : Error(message)
{ }

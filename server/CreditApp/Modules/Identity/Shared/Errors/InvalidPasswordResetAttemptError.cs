namespace CreditApp.Modules.Identity.Shared.Errors;

using FluentResults;

public class InvalidPasswordResetAttemptError(
    string message = "Invalid password reset attempt!") : Error(message)
{ }

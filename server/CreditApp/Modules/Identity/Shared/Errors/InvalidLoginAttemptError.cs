namespace CreditApp.Modules.Identity.Shared.Errors;

using FluentResults;

public sealed class InvalidLoginAttemptError(
    string message = "Невалидно потребителско име, имейл или парола.") : Error(message)
{ }

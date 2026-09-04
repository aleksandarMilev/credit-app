namespace CreditApp.Modules.Identity.Shared.Errors;

using FluentResults;

public class InvalidPasswordResetAttemptError(
    string message = "Невалиден опит за възстановяване на паролата.") : Error(message)
{ }

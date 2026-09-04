namespace CreditApp.Modules.Applications.Shared.Errors;

using FluentResults;

public sealed class PendingApplicationAlreadyExistsError()
    : Error("Вече имате чакаща обработка кандидатура. Моля, изчакайте тя да бъде разгледана.")
{ }

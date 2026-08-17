namespace CreditApp.Modules.Applications.Shared.Errors;

using FluentResults;

public sealed class ApplicationNotFoundError()
    : Error("Кандидатурата не е намерена.")
{ }

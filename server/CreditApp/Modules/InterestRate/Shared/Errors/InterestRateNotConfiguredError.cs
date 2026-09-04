namespace CreditApp.Modules.InterestRate.Shared.Errors;

using FluentResults;

public sealed class InterestRateNotConfiguredError()
    : Error("Лихвеният процент все още не е конфигуриран.")
{ }

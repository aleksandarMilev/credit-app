namespace CreditApp.Modules.InterestRate.Shared.Errors;

using FluentResults;

public sealed class InvalidInterestRateError(string message)
    : Error(message)
{ }

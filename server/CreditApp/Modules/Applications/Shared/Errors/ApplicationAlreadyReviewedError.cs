namespace CreditApp.Modules.Applications.Shared.Errors;

using FluentResults;

public sealed class ApplicationAlreadyReviewedError()
    : Error("Тази кандидатура вече е разгледана и решението не може да бъде променено.")
{ }

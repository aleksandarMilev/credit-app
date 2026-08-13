namespace CreditApp.Modules.Identity.Shared.Errors;

using FluentResults;

public sealed class AccountIsLockedError()
    : Error("Account is locked. Try again later.")
{ }

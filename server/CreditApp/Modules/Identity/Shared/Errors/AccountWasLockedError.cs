namespace CreditApp.Modules.Identity.Shared.Errors;

using FluentResults;

public sealed class AccountWasLockedError()
    : Error("Account locked due to multiple failed attempts.")
{ }

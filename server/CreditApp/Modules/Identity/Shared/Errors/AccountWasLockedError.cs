namespace CreditApp.Modules.Identity.Shared.Errors;

using FluentResults;

public sealed class AccountWasLockedError()
    : Error("Акаунтът беше заключен поради множество неуспешни опити за вход.")
{ }

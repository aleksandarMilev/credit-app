namespace CreditApp.Modules.Identity.Shared.Errors;

using FluentResults;

public sealed class AccountIsLockedError()
    : Error("Акаунтът е заключен. Опитайте отново по-късно.")
{ }

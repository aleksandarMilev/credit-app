namespace CreditApp.Modules.Identity.Shared.Errors;

using FluentResults;

public sealed class EmailTakenError(
    string username) : Error($"Email '{username}' is already taken.")
{ }

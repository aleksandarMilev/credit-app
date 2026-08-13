namespace CreditApp.Modules.Identity.Shared.Errors;

using FluentResults;

public sealed class UsernameTakenError(
    string username) : Error($"Username '{username}' is already taken.")
{ }

namespace CreditApp.Modules.Identity.Shared.Errors;

using FluentResults;
public sealed class NoRoleAssignedError()
    : Error("На акаунта не е зададена роля. Свържете се с администратор.")
{ }
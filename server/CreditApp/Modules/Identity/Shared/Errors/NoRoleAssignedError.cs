namespace CreditApp.Modules.Identity.Shared.Errors;

using FluentResults;
public sealed class NoRoleAssignedError()
    : Error("Account has no assigned role. Contact an administrator.")
{ }
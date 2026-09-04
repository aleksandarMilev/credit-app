namespace CreditApp.Shared.Services.CurrentUser;

using ServiceLifetimes;

public interface ICurrentUserService : IScopedService
{
    string? GetUsername();

    string? GetId();

    bool IsApprover();

    bool IsViewer();
}

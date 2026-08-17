namespace CreditApp.Shared.Services.CurrentUser;

using System.Security.Claims;
using Extensions;

using static Constants.Names;

public class CurrentUserService(
    IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    private ClaimsPrincipal? User
        => httpContextAccessor.HttpContext?.User;

    public string? GetUsername()
        => this.User?.Identity?.Name;

    public string? GetId()
        => this.User?.GetId();

    public bool IsApprover()
        => this.User?.IsInRole(ApproverRoleName) ?? false;

    public bool IsViewer()
        => this.User?.IsInRole(ViewerRoleName) ?? false;
}

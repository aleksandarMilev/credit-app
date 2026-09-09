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
}

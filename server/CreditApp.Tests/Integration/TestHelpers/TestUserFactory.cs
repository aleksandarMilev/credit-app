namespace CreditApp.Tests.Integration.TestHelpers;

using CreditApp.Modules.Identity.Data.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

public static class TestUserFactory
{
    public static async Task<UserDbModel> CreateStaffUser(
        IServiceProvider services,
        string username,
        string password,
        string role)
    {
        var userManager = services.GetRequiredService<UserManager<UserDbModel>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

        if (!await roleManager.RoleExistsAsync(role))
        {
            var identityRole = new IdentityRole(role);
            await roleManager.CreateAsync(identityRole);
        }

        var user = new UserDbModel
        {
            UserName = username,
            Email = $"{username}@test.local",
            EmailConfirmed = true,
            LockoutEnabled = true,
            FirstName = "Test",
            LastName = "User"
        };

        var createResult = await userManager.CreateAsync(
            user,
            password);

        if (!createResult.Succeeded)
        {
            throw new InvalidOperationException(
                string.Join(
                    "; ",
                    createResult.Errors.Select(static e => e.Description)));
        }

        await userManager.AddToRoleAsync(user, role);

        return user;
    }
}

namespace CreditApp.Shared.Extensions;

using Data;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Modules.Identity.Data.Models;
using Modules.InterestRate.Shared;
using Settings;

using static Shared.Constants.Cors;
using static Shared.Constants.Names;

internal sealed record SeedUserDefinition(
    string? Username,
    string? Email,
    string? Password,
    string Role,
    string FirstName,
    string LastName);

public static class AppBuilderExtensions
{
    extension(IApplicationBuilder app)
    {
        public IApplicationBuilder UseCustomForwardedHeaders()
        {
            var forwardedHeadersOptions = new ForwardedHeadersOptions
            {
                ForwardedHeaders =
                    ForwardedHeaders.XForwardedFor |
                    ForwardedHeaders.XForwardedProto,
                ForwardLimit = 1,
            };

            forwardedHeadersOptions.KnownProxies.Clear();

            app.UseForwardedHeaders(forwardedHeadersOptions);

            return app;
        }

        public async Task<IApplicationBuilder> UseMigrations(
            CancellationToken cancellationToken = default)
        {
            using var services = app
                .ApplicationServices
                .CreateScope();

            var data = services
                .ServiceProvider
                .GetRequiredService<CreditAppDbContext>();

            await data
                .Database
                .MigrateAsync(cancellationToken);

            return app;
        }

        public IApplicationBuilder UseAppEndpoints()
        {
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                endpoints.MapHealthChecks("/health");
            });

            return app;
        }

        public IApplicationBuilder UseAllowedCors()
            => app.UseCors(CorsPolicyName);

        public async Task<IApplicationBuilder> UseBuiltInUser()
        {
            static async Task EnsureRoleExists(
                RoleManager<IdentityRole> roleManager,
                string roleName,
                ILogger logger)
            {
                if (await roleManager.RoleExistsAsync(roleName))
                {
                    return;
                }

                var role = new IdentityRole(roleName);
                var result = await roleManager.CreateAsync(role);

                if (!result.Succeeded)
                {
                    logger.LogError(
                        "Failed to create role {Role}: {Errors}",
                        roleName,
                        string.Join(
                            "; ",
                            result.Errors.Select(static e => e.Description)));
                }
            }

            using var serviceScope = app
                .ApplicationServices
                .CreateScope();

            var services = serviceScope.ServiceProvider;

            var logger = services
                .GetRequiredService<ILoggerFactory>()
                .CreateLogger("SeedUser");

            var seedUserSettings = services
                .GetRequiredService<IOptions<SeedUserSettings>>()
                .Value;

            var userManager = services.GetRequiredService<UserManager<UserDbModel>>();
            var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

            await EnsureRoleExists(
                roleManager,
                ApproverRoleName,
                logger);

            await EnsureRoleExists(
                roleManager,
                ViewerRoleName,
                logger);

            var seedUsers = new SeedUserDefinition[]
            {
                new(
                    seedUserSettings.ApproverUsername,
                    seedUserSettings.ApproverEmail,
                    seedUserSettings.ApproverPassword,
                    ApproverRoleName,
                    "Approver",
                    "Account"),
                new(
                    seedUserSettings.Viewer1Username,
                    seedUserSettings.Viewer1Email,
                    seedUserSettings.Viewer1Password,
                    ViewerRoleName,
                    "Viewer",
                    "Account 1"),
                new(
                    seedUserSettings.Viewer2Username,
                    seedUserSettings.Viewer2Email,
                    seedUserSettings.Viewer2Password,
                    ViewerRoleName,
                    "Viewer",
                    "Account 2")
            };

            foreach (var seedUser in seedUsers)
            {
                var isNotConfigured =
                    string.IsNullOrWhiteSpace(seedUser.Username) ||
                    string.IsNullOrWhiteSpace(seedUser.Email) ||
                    string.IsNullOrWhiteSpace(seedUser.Password);

                if (isNotConfigured)
                {
                    logger.LogWarning(
                        "Seed user for role {Role} is not configured — skipping.",
                        seedUser.Role);

                    continue;
                }

                var existingUser = await userManager.FindByNameAsync(seedUser.Username!);

                if (existingUser is not null)
                {
                    logger.LogInformation(
                        "Seed user {Username} already exists — skipping creation.",
                        seedUser.Username);

                    continue;
                }

                var user = new UserDbModel
                {
                    UserName = seedUser.Username,
                    Email = seedUser.Email,
                    EmailConfirmed = true,
                    LockoutEnabled = true,
                    FirstName = seedUser.FirstName,
                    LastName = seedUser.LastName
                };

                var createResult = await userManager.CreateAsync(
                    user,
                    seedUser.Password!);

                if (!createResult.Succeeded)
                {
                    logger.LogError(
                        "Failed to seed user {Username}: {Errors}",
                        seedUser.Username,
                        string.Join(
                            "; ",
                            createResult.Errors.Select(static e => e.Description)));

                    continue;
                }

                await userManager.AddToRoleAsync(user, seedUser.Role);

                logger.LogInformation(
                    "Seeded user {Username} with role {Role}.",
                    seedUser.Username,
                    seedUser.Role);
            }

            return app;
        }

        public async Task<IApplicationBuilder> UseSeedInterestRate(
            CancellationToken cancellationToken = default)
        {
            using var serviceScope = app
                .ApplicationServices
                .CreateScope();

            await InterestRateSeeder.SeedIfMissing(
                serviceScope.ServiceProvider,
                cancellationToken);

            return app;
        }
    }
}

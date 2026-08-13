namespace CreditApp.Shared.Extensions;

using Data;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Modules.Identity.Data.Models;
using Modules.Identity.Service;
using Modules.Identity.Service.Models;

using static Shared.Constants.Cors;
using static Shared.Constants.Names;

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

        public async Task<IApplicationBuilder> UseBuiltInUser(
            CancellationToken cancellationToken = default)
        {
            using var serviceScope = app
                .ApplicationServices
                .CreateScope();

            var identityService = serviceScope
                .ServiceProvider
                .GetRequiredService<IIdentityService>();

            var serviceModel = new RegisterServiceModel(
                "mileww.sasho",
                "aleksandarmilev23@gmail.com",
                "123456",
                "Alexandar",
                "Milev",
                new DateTime(2001, 2, 8));

            await identityService.Register(
                serviceModel,
                cancellationToken);

            return app;
        }

        public async Task<IApplicationBuilder> UseDevAdminRole()
        {
            using var serviceScope = app
                .ApplicationServices
                .CreateScope();

            var services = serviceScope.ServiceProvider;

            var userManager = services
                .GetRequiredService<UserManager<UserDbModel>>();

            var roleManager = services
                .GetRequiredService<RoleManager<IdentityRole>>();

            if (await roleManager.RoleExistsAsync(AdminRoleName))
            {
                return app;
            }

            var role = new IdentityRole
            {
                Name = AdminRoleName
            };

            await roleManager.CreateAsync(role);

            const string AdminEmail = "admin@mail.com";
            const string AdminPassword = "admin1234";

            var user = new UserDbModel
            {
                Email = AdminEmail,
                UserName = AdminRoleName
            };

            await userManager.CreateAsync(user, AdminPassword);
            await userManager.AddToRoleAsync(user, role.Name);

            return app;
        }

        // We need this method to create administrator if we drop the production db for some reason.
        // Don't delete it!
        public async Task<IApplicationBuilder> UseProductionAdminRole()
        {
            using var scope = app
                .ApplicationServices
                .CreateScope();

            var services = scope.ServiceProvider;

            var logger = services
                .GetRequiredService<ILoggerFactory>()
                .CreateLogger("BootstrapAdmin");

            var config = services.GetRequiredService<IConfiguration>();
            var enabled = string.Equals(
                config["BootstrapAdmin:Enabled"],
                "true",
                StringComparison.OrdinalIgnoreCase);

            logger.LogInformation("BootstrapAdmin Enabled = {Enabled}", enabled);

            if (!enabled)
            {
                return app;
            }

            var email = config["BootstrapAdmin:Email"];
            var password = config["BootstrapAdmin:Password"];
            var roleName = config["BootstrapAdmin:Role"] ?? AdminRoleName;

            var emailOrPasswordIsNotProvided =
                string.IsNullOrWhiteSpace(email) ||
                string.IsNullOrWhiteSpace(password);

            if (emailOrPasswordIsNotProvided)
            {
                throw new InvalidOperationException(
                    "BootstrapAdmin enabled but Email/Password not set.");
            }

            var userManager = services
                .GetRequiredService<UserManager<UserDbModel>>();

            var roleManager = services
                .GetRequiredService<RoleManager<IdentityRole>>();

            if (!await roleManager.RoleExistsAsync(roleName))
            {
                var role = new IdentityRole(roleName);
                var createRoleResult = await roleManager.CreateAsync(role);

                if (!createRoleResult.Succeeded)
                {
                    var roleResultErrorMessage = createRoleResult
                        .Errors
                        .Select(static e => e.Description);

                    throw new InvalidOperationException(
                        "Failed to create role: " + string.Join("; ", roleResultErrorMessage));
                }

                logger.LogInformation("Created role {Role}", roleName);
            }
            else
            {
                logger.LogInformation("Role {Role} already exists", roleName);
            }

            var user = await userManager.FindByEmailAsync(email!);
            if (user is null)
            {
                user = new()
                {
                    Email = email,
                    UserName = email
                };

                var createUserResult = await userManager.CreateAsync(user, password!);
                if (!createUserResult.Succeeded)
                {
                    var errorMessage = createUserResult
                        .Errors
                        .Select(static e => e.Description);

                    throw new InvalidOperationException(
                        "Failed to create admin user: " + string.Join("; ", errorMessage));
                }

                logger.LogInformation("Created user {Email}", email);
            }
            else
            {
                logger.LogInformation("User {Email} already exists", email);
            }

            if (!await userManager.IsInRoleAsync(user, roleName))
            {
                var addToRoleResult = await userManager.AddToRoleAsync(
                    user,
                    roleName);

                if (!addToRoleResult.Succeeded)
                {
                    var errorMessage = addToRoleResult
                        .Errors
                        .Select(static e => e.Description);

                    throw new InvalidOperationException(
                        "Failed to add role: " + string.Join("; ", errorMessage));
                }

                logger.LogInformation("Added user {Email} to role {Role}", email, roleName);
            }
            else
            {
                logger.LogInformation("User {Email} already in role {Role}", email, roleName);
            }

            return app;
        }
    }
}

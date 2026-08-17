namespace CreditApp.Tests.Integration.TestHelpers;

using CreditApp.Modules.Email;
using CreditApp.Shared.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Testcontainers.PostgreSql;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public const string JwtSecret = "integration-test-super-secret-signing-key-value";
    public const string JwtIssuer = "CreditApp.Tests";
    public const string JwtAudience = "CreditApp.Tests.Client";

    private readonly PostgreSqlContainer postgresContainer = new PostgreSqlBuilder("postgres:16")
        .WithDatabase("CreditAppTests")
        .WithUsername("creditapp_test")
        .WithPassword("creditapp_test")
        .Build();

    private readonly string uploadsRootPath = Path.Combine(
        Path.GetTempPath(),
        "credit-app-tests",
        Guid.NewGuid().ToString("N"));

    public CustomWebApplicationFactory()
    {
        Environment.SetEnvironmentVariable("FileStorageSettings__UploadsRootPath", this.uploadsRootPath);
        // AddJwtAuthentication() reads JwtSettings eagerly at startup (before ConfigureWebHost's
        // hooks can apply), so overriding it via ConfigureAppConfiguration is too late — it must
        // already be visible in the process environment (the same mechanism docker-compose uses)
        // by the time Program.cs's builder.Services.AddJwtAuthentication(...) call runs.
        Environment.SetEnvironmentVariable("JwtSettings__Secret", JwtSecret);
        Environment.SetEnvironmentVariable("JwtSettings__Issuer", JwtIssuer);
        Environment.SetEnvironmentVariable("JwtSettings__Audience", JwtAudience);
        Environment.SetEnvironmentVariable("AppUrlsSettings__ClientBaseUrl", "http://localhost:5173");
        Environment.SetEnvironmentVariable("EmailSettings__Host", "localhost");
        Environment.SetEnvironmentVariable("EmailSettings__Port", "1025");
        Environment.SetEnvironmentVariable("EmailSettings__From", "test@creditapp.local");
        Environment.SetEnvironmentVariable("EmailSettings__UseSsl", "false");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            services.AddDbContext<CreditAppDbContext>(options =>
                options.UseNpgsql(this.postgresContainer.GetConnectionString()));

            services.RemoveAll<IEmailSender>();
            services.AddSingleton<IEmailSender, FakeEmailSender>();
        });
    }

    public async Task InitializeAsync()
    {
        await this.postgresContainer.StartAsync();

        using var scope = this.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CreditAppDbContext>();

        await dbContext.Database.MigrateAsync();
    }

    public new async Task DisposeAsync()
    {
        await this.postgresContainer.DisposeAsync();

        if (Directory.Exists(this.uploadsRootPath))
        {
            Directory.Delete(this.uploadsRootPath, recursive: true);
        }
    }
}

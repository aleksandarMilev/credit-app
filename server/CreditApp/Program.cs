using CreditApp.Shared;
using CreditApp.Shared.Extensions;
using FluentResults.Extensions.AspNetCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

var builderEnvIsNotTesting = !builder
    .Environment
    .IsEnvironment("Testing");

builder
    .Services
    .AddHttpContextAccessor()
    .AddAppSettings(builder.Configuration)
    .AddIdentity(builder.Environment)
    .AddJwtAuthentication(
        builder.Configuration,
        builder.Environment)
    .AddApiControllers()
    .AddServices()
    .AddOpenApi()
    .AddHealthcheck()
    .AddMemoryCache()
    .AddRateLimiting(builder.Environment);

AspNetCoreResult.Setup(settings =>
{
    settings.DefaultProfile = new ResultProfile();
});

if (builderEnvIsNotTesting)
{
    builder
        .Services
        .AddCorsPolicy(
            builder.Configuration,
            builder.Environment);

    builder
        .Services
        .AddDatabase(builder.Configuration);
}

var app = builder.Build();
var canceltationToken = app.Lifetime.ApplicationStopping;

var appEnvIsDev = app.Environment.IsDevelopment();
var appEnvIsNotTesting = !app
    .Environment
    .IsEnvironment("Testing");

if (appEnvIsDev)
{
    app.UseDeveloperExceptionPage();
}
else
{
    app
        .UseHsts()
        .UseHttpsRedirection()
        .UseCustomForwardedHeaders();
}

app
    .UseRouting()
    .UseStaticFiles();

if (appEnvIsNotTesting)
{
    app.UseAllowedCors();
}

app
    .UseAuthentication()
    .UseRateLimiter()
    .UseAuthorization()
    .UseAppEndpoints();

if (appEnvIsDev)
{
    app.MapOpenApi();
    app.MapScalarApiReference();

    await app.UseMigrations(canceltationToken);
    await app.UseBuiltInUser(canceltationToken);
    await app.UseDevAdminRole();
}

await app.RunAsync(canceltationToken);

public partial class Program { }

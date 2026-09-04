using CreditApp.Modules.Applications.Service;
using CreditApp.Shared;
using CreditApp.Shared.Extensions;
using FluentResults.Extensions.AspNetCore;
using Scalar.AspNetCore;
using Serilog;

var builder = WebApplication
    .CreateBuilder(args)
    .UseSerilog();

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

AspNetCoreResult.Setup(static settings =>
{
    settings.DefaultProfile = new ResultProfile();
});

var builderEnvIsNotTesting = !builder
    .Environment
    .IsEnvironment("Testing");

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

    builder
        .Services
        .AddHostedService<ApplicationRetentionWorker>();
}

var app = builder.Build();
var cancellationToken = app
    .Lifetime
    .ApplicationStopping;

var appEnvIsDev = app
    .Environment
    .IsDevelopment();

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

app.UseSerilogRequestLogging();

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

    await app.UseMigrations(cancellationToken);
}

if (appEnvIsNotTesting)
{
    await app.UseBuiltInUser();
    await app.UseSeedInterestRate(cancellationToken);
}

await app.RunAsync(cancellationToken);

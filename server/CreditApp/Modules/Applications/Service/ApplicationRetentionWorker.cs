namespace CreditApp.Modules.Applications.Service;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

public class ApplicationRetentionWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<ApplicationRetentionWorker> logger) : BackgroundService
{
    private static readonly TimeSpan RunInterval = TimeSpan.FromDays(1);

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await this.RunRetentionSweep(stoppingToken);

            try
            {
                await Task.Delay(RunInterval, stoppingToken);
            }
            catch (TaskCanceledException) { }
        }
    }

    private async Task RunRetentionSweep(
        CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();

        var applicationsService = scope
            .ServiceProvider
            .GetRequiredService<IApplicationsService>();

        try
        {
            var softDeletedCount = await applicationsService
                .SoftDeleteExpired(cancellationToken);

            logger.LogInformation(
                "Retention sweep: soft-deleted {Count} expired applications.",
                softDeletedCount);

            var hardDeletedCount = await applicationsService
                .HardDeleteExpired(cancellationToken);

            logger.LogInformation(
                "Retention sweep: hard-deleted {Count} expired applications.",
                hardDeletedCount);
        }
        catch (OptionsValidationException exception)
        {
            logger.LogCritical(
                exception,
                "Retention sweep skipped — ApplicationRetentionSettings failed validation. " +
                "This will NOT resolve on its own; fix the SoftDeleteAfterDays/" +
                "HardDeleteGracePeriodDays configuration and restart the application. " +
                "Failures: {ValidationFailures}",
                string.Join("; ", exception.Failures));
        }
        catch (Exception exception)
        {
            logger.LogError(
                exception,
                "Retention sweep failed — will retry on next scheduled run.");
        }
    }
}

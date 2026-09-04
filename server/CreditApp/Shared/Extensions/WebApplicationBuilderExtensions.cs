namespace CreditApp.Shared.Extensions;

using Serilog;
using Serilog.Formatting.Compact;
using Settings;

public static class WebApplicationBuilderExtensions
{
    extension(WebApplicationBuilder builder)
    {
        public WebApplicationBuilder UseSerilog()
        {
            builder
                .Host
                .UseSerilog(static (context, loggerConfiguration) =>
                {
                    var seqSettings = context.Configuration
                        .GetSection(nameof(SeqSettings))
                        .Get<SeqSettings>()
                        ?? new SeqSettings();

                    loggerConfiguration
                        .ReadFrom.Configuration(context.Configuration)
                        .Enrich.FromLogContext()
                        .Enrich.WithProperty("MachineName", Environment.MachineName)
                        .Enrich.WithProperty("EnvironmentName", context.HostingEnvironment.EnvironmentName)
                        .WriteTo.Console(new CompactJsonFormatter());

                    if (!string.IsNullOrWhiteSpace(seqSettings.ServerUrl))
                    {
                        loggerConfiguration.WriteTo.Seq(seqSettings.ServerUrl);
                    }
                });

            return builder;
        }
    }
}

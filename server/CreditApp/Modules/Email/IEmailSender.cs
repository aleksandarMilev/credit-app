namespace CreditApp.Modules.Email;

using Shared.Services.ServiceLifetimes;

public interface IEmailSender : ITransientService
{
    Task SendPasswordReset(
        string email,
        string resetUrl,
        CancellationToken cancellationToken = default);
}

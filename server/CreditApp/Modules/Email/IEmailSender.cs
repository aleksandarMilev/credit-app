namespace CreditApp.Modules.Email;

using Shared.Services.ServiceLifetimes;

public interface IEmailSender : ITransientService
{
    Task SendPasswordReset(
        string email,
        string resetUrl,
        CancellationToken cancellationToken = default);

    Task SendApplicationSubmitted(
        string email,
        string applicantName,
        CancellationToken cancellationToken = default);

    Task SendApplicationApproved(
        string email,
        string applicantName,
        CancellationToken cancellationToken = default);

    Task SendApplicationRejected(
        string email,
        string applicantName,
        CancellationToken cancellationToken = default);
}

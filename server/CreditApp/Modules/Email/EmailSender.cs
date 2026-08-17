namespace CreditApp.Modules.Email;

using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using Shared.Settings;
using Templates;

public class EmailSender(
    IOptions<EmailSettings> emailSettings,
    ILogger<EmailSender> logger) : IEmailSender
{
    public async Task SendPasswordReset(
        string email,
        string resetUrl,
        CancellationToken cancellationToken = default)
        => await this.Send(
            email,
            "Променете вашата паролоа в CreditApp",
            PasswordResetEmailTemplate.Build(resetUrl),
            cancellationToken);

    public async Task SendApplicationSubmitted(
        string email,
        string applicantName,
        CancellationToken cancellationToken = default)
        => await this.Send(
            email,
            "Получихме Вашата кредитна заявка",
            ApplicationSubmittedEmailTemplate.Build(applicantName),
            cancellationToken);

    public async Task SendApplicationApproved(
        string email,
        string applicantName,
        CancellationToken cancellationToken = default)
        => await this.Send(
            email,
            "Вашата кредитна заявка е одобрена",
            ApplicationApprovedEmailTemplate.Build(applicantName),
            cancellationToken);

    public async Task SendApplicationRejected(
        string email,
        string applicantName,
        CancellationToken cancellationToken = default)
        => await this.Send(
            email,
            "Относно Вашата кредитна заявка",
            ApplicationRejectedEmailTemplate.Build(applicantName),
            cancellationToken);

    private async Task Send(
        string to,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken = default)
    {
        var message = new MimeMessage();

        message.From.Add(MailboxAddress.Parse(emailSettings.Value.From));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;
        message.Body = new TextPart("html")
        {
            Text = htmlBody
        };

        using var client = new SmtpClient();

        try
        {
            var secureOption = emailSettings
                .Value
                .UseSsl
                    ? SecureSocketOptions.StartTls
                    : SecureSocketOptions.Auto;

            await client.ConnectAsync(
                emailSettings.Value.Host,
                emailSettings.Value.Port,
                secureOption,
                cancellationToken);

            if (!string.IsNullOrWhiteSpace(emailSettings.Value.Username))
            {
                await client.AuthenticateAsync(
                    emailSettings.Value.Username,
                    emailSettings.Value.Password,
                    cancellationToken);
            }

            await client.SendAsync(message, cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Error sending email.");
            throw;
        }
        finally
        {
            if (client.IsConnected)
            {
                await client.DisconnectAsync(true, cancellationToken);
            }
        }
    }
}

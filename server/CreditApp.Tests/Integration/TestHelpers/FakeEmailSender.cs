namespace CreditApp.Tests.Integration.TestHelpers;

using CreditApp.Modules.Email;

public class FakeEmailSender : IEmailSender
{
    public List<string> WelcomeEmailsSentTo { get; } = [];

    public List<string> PasswordResetEmailsSentTo { get; } = [];

    public Task SendWelcome(
        string email,
        string username,
        string baseUrl,
        CancellationToken cancellationToken = default)
    {
        this.WelcomeEmailsSentTo.Add(email);

        return Task.CompletedTask;
    }

    public Task SendPasswordReset(
        string email,
        string resetUrl,
        CancellationToken cancellationToken = default)
    {
        this.PasswordResetEmailsSentTo.Add(email);

        return Task.CompletedTask;
    }
}

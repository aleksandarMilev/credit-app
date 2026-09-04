namespace CreditApp.Tests.Integration.TestHelpers;

using CreditApp.Modules.Email;

public class FakeEmailSender : IEmailSender
{
    public List<string> PasswordResetEmailsSentTo { get; } = [];

    public List<string> ApplicationSubmittedEmailsSentTo { get; } = [];

    public List<string> ApplicationApprovedEmailsSentTo { get; } = [];

    public List<string> ApplicationRejectedEmailsSentTo { get; } = [];

    public Task SendPasswordReset(
        string email,
        string resetUrl,
        CancellationToken cancellationToken = default)
    {
        this.PasswordResetEmailsSentTo.Add(email);

        return Task.CompletedTask;
    }

    public Task SendApplicationSubmitted(
        string email,
        string applicantName,
        CancellationToken cancellationToken = default)
    {
        this.ApplicationSubmittedEmailsSentTo.Add(email);

        return Task.CompletedTask;
    }

    public Task SendApplicationApproved(
        string email,
        string applicantName,
        CancellationToken cancellationToken = default)
    {
        this.ApplicationApprovedEmailsSentTo.Add(email);

        return Task.CompletedTask;
    }

    public Task SendApplicationRejected(
        string email,
        string applicantName,
        CancellationToken cancellationToken = default)
    {
        this.ApplicationRejectedEmailsSentTo.Add(email);

        return Task.CompletedTask;
    }
}

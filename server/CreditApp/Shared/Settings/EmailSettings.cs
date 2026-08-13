namespace CreditApp.Shared.Settings;

public record EmailSettings(
    string Host,
    int Port,
    string Username,
    string Password,
    string From,
    bool UseSsl);

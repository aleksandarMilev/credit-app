namespace CreditApp.Shared.Settings;

public record JwtSettings(
    string Secret,
    string Issuer = "CreditApp",
    string Audience = "CreditAppClient");

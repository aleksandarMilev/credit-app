namespace CreditApp.Shared.Settings;

public class JwtSettings
{
    public string Secret { get; set; } = string.Empty;

    public string Issuer { get; set; } = "CreditApp";

    public string Audience { get; set; } = "CreditAppClient";
}

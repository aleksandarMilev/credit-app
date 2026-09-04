namespace CreditApp.Shared.Settings;

public class ApplicationRetentionSettings
{
    public int SoftDeleteAfterDays { get; set; } = 90;

    public int HardDeleteGracePeriodDays { get; set; } = 30;
}

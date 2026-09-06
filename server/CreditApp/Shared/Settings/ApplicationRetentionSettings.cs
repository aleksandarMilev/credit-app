namespace CreditApp.Shared.Settings;

using System.ComponentModel.DataAnnotations;

public class ApplicationRetentionSettings
{
    [Range(
        1,
        3_650,
        ErrorMessage = "SoftDeleteAfterDays must be a positive number of days.")]
    public int SoftDeleteAfterDays { get; set; } = 90;

    [Range(
        1,
        3_650,
        ErrorMessage = "HardDeleteGracePeriodDays must be a positive number of days.")]
    public int HardDeleteGracePeriodDays { get; set; } = 30;
}

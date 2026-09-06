namespace CreditApp.Shared.Settings;

using System.ComponentModel.DataAnnotations;

public class EgnEncryptionSettings
{
    [Required(
        ErrorMessage = "EgnEncryptionSettings:Key must be configured.")]
    public string Key { get; set; } = "";
}

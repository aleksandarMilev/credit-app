namespace CreditApp.Shared.Settings;

using System.ComponentModel.DataAnnotations;

public class FileStorageSettings
{
    [Required(
        ErrorMessage = "FileStorageSettings:UploadsRootPath must be configured.")]
    public string UploadsRootPath { get; set; } = "App_Data/uploads";
}

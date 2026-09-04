namespace CreditApp.Modules.Identity.Service.Models;

public record ResetPasswordServiceModel(
    string Email,
    string Token,
    string NewPassword);

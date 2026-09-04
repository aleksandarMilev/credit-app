namespace CreditApp.Modules.Identity.Service.Models;

public record LoginServiceModel(
    string Credentials,
    string Password,
    bool RememberMe);

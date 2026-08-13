namespace CreditApp.Modules.Identity.Service.Models;

public record RegisterServiceModel(
    string Username,
    string Email,
    string Password,
    string FirstName,
    string LastName,
    DateTime DateOfBirth);

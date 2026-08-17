namespace CreditApp.Modules.Applications.Shared.Errors;

using FluentResults;

public sealed class EmptyIdCardImageError()
    : Error("Файлът със снимката на личната карта е празен.")
{ }

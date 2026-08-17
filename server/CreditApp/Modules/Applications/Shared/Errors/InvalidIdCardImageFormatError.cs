
namespace CreditApp.Modules.Applications.Shared.Errors;

using FluentResults;

public sealed class InvalidIdCardImageFormatError()
    : Error("Съдържанието на файла не съответства на позволен формат на изображение.")
{ }

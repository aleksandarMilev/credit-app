namespace CreditApp.Modules.Applications.Shared;

public enum IdCardImageValidationResult
{
    Valid,
    Empty,
    TooLarge,
    InvalidExtension,
    ContentTypeMismatch,
    ContentDoesNotMatchFormat
}

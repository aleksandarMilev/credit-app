namespace CreditApp.Modules.Applications.Shared;

using static Constants.Validation;

public static class IdCardImageValidator
{
    public static IdCardImageValidationResult Validate(
        string contentType,
        string fileName,
        long sizeBytes,
        Stream content)
    {
        if (sizeBytes == 0)
        {
            return IdCardImageValidationResult.Empty;
        }

        if (sizeBytes > MaxIdCardImageSizeBytes)
        {
            return IdCardImageValidationResult.TooLarge;
        }

        var extension = Path
            .GetExtension(fileName)
            .ToLowerInvariant();

        var expectedContentType = extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            _ => null
        };

        if (expectedContentType is null)
        {
            return IdCardImageValidationResult.InvalidExtension;
        }

        if (!string.Equals(
            contentType,
            expectedContentType,
            StringComparison.OrdinalIgnoreCase))
        {
            return IdCardImageValidationResult.ContentTypeMismatch;
        }

        return ContentMatchesExtension(content, extension)
            ? IdCardImageValidationResult.Valid
            : IdCardImageValidationResult.ContentDoesNotMatchFormat;
    }

    private static bool ContentMatchesExtension(Stream content, string extension)
    {
        Span<byte> header = stackalloc byte[8];

        var originalPosition = content.CanSeek
            ? content.Position
            : 0;

        var read = content.Read(header);

        if (content.CanSeek)
        {
            content.Position = originalPosition;
        }

        if (read < 8)
        {
            return false;
        }

        return extension switch
        {
            ".jpg" or ".jpeg" =>
                header[0] == 0xFF &&
                header[1] == 0xD8 &&
                header[2] == 0xFF,

            ".png" =>
                header[0] == 0x89 &&
                header[1] == 0x50 &&
                header[2] == 0x4E &&
                header[3] == 0x47 &&
                header[4] == 0x0D &&
                header[5] == 0x0A &&
                header[6] == 0x1A &&
                header[7] == 0x0A,

            _ => false
        };
    }
}

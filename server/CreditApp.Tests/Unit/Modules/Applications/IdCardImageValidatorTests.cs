namespace CreditApp.Tests.Unit.Modules.Applications;

using CreditApp.Modules.Applications.Shared;

public class IdCardImageValidatorTests
{
    private static readonly byte[] ValidJpegBytes =
        [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02];

    private static readonly byte[] ValidPngBytes =
        [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00];

    private const long MaxSizeBytes = 10 * 1_024 * 1_024;

    [Fact]
    public void Validate_ValidJpeg_ReturnsValid()
    {
        using var content = CreateStream(ValidJpegBytes);

        var result = IdCardImageValidator.Validate(
            "image/jpeg",
            "id-card.jpg",
            content.Length,
            content);

        Assert.Equal(IdCardImageValidationResult.Valid, result);
    }

    [Fact]
    public void Validate_ValidJpegWithJpegExtension_ReturnsValid()
    {
        using var content = CreateStream(ValidJpegBytes);

        var result = IdCardImageValidator.Validate(
            "image/jpeg",
            "id-card.jpeg",
            content.Length,
            content);

        Assert.Equal(IdCardImageValidationResult.Valid, result);
    }

    [Fact]
    public void Validate_ValidPng_ReturnsValid()
    {
        using var content = CreateStream(ValidPngBytes);

        var result = IdCardImageValidator.Validate(
            "image/png",
            "id-card.png",
            content.Length,
            content);

        Assert.Equal(IdCardImageValidationResult.Valid, result);
    }

    [Fact]
    public void Validate_ZeroSize_ReturnsEmpty()
    {
        using var content = CreateStream([]);

        var result = IdCardImageValidator.Validate(
            "image/jpeg",
            "id-card.jpg",
            0,
            content);

        Assert.Equal(IdCardImageValidationResult.Empty, result);
    }

    [Fact]
    public void Validate_ExceedsMaxSize_ReturnsTooLarge()
    {
        using var content = CreateStream(ValidJpegBytes);

        var result = IdCardImageValidator.Validate(
            "image/jpeg",
            "id-card.jpg",
            MaxSizeBytes + 1,
            content);

        Assert.Equal(IdCardImageValidationResult.TooLarge, result);
    }

    [Fact]
    public void Validate_AtExactMaxSize_DoesNotReturnTooLarge()
    {
        using var content = CreateStream(ValidJpegBytes);

        var result = IdCardImageValidator.Validate(
            "image/jpeg",
            "id-card.jpg",
            MaxSizeBytes,
            content);

        Assert.NotEqual(IdCardImageValidationResult.TooLarge, result);
    }

    [Fact]
    public void Validate_UnsupportedExtension_ReturnsInvalidExtension()
    {
        using var content = CreateStream(ValidJpegBytes);

        var result = IdCardImageValidator.Validate(
            "application/pdf",
            "id-card.pdf",
            content.Length,
            content);

        Assert.Equal(IdCardImageValidationResult.InvalidExtension, result);
    }

    [Fact]
    public void Validate_NoExtension_ReturnsInvalidExtension()
    {
        using var content = CreateStream(ValidJpegBytes);

        var result = IdCardImageValidator.Validate(
            "image/jpeg",
            "id-card",
            content.Length,
            content);

        Assert.Equal(IdCardImageValidationResult.InvalidExtension, result);
    }

    [Fact]
    public void Validate_JpegExtensionWithPngContentType_ReturnsContentTypeMismatch()
    {
        using var content = CreateStream(ValidJpegBytes);

        var result = IdCardImageValidator.Validate(
            "image/png",
            "id-card.jpg",
            content.Length,
            content);

        Assert.Equal(IdCardImageValidationResult.ContentTypeMismatch, result);
    }

    [Fact]
    public void Validate_PngExtensionWithJpegContentType_ReturnsContentTypeMismatch()
    {
        using var content = CreateStream(ValidPngBytes);

        var result = IdCardImageValidator.Validate(
            "image/jpeg",
            "id-card.png",
            content.Length,
            content);

        Assert.Equal(IdCardImageValidationResult.ContentTypeMismatch, result);
    }

    [Fact]
    public void Validate_ContentTypeCasingDiffers_StillMatches()
    {
        using var content = CreateStream(ValidJpegBytes);

        var result = IdCardImageValidator.Validate(
            "IMAGE/JPEG",
            "id-card.jpg",
            content.Length,
            content);

        Assert.Equal(IdCardImageValidationResult.Valid, result);
    }

    [Fact]
    public void Validate_ExtensionCasingDiffers_StillMatches()
    {
        using var content = CreateStream(ValidJpegBytes);

        var result = IdCardImageValidator.Validate(
            "image/jpeg",
            "ID-CARD.JPG",
            content.Length,
            content);

        Assert.Equal(IdCardImageValidationResult.Valid, result);
    }

    [Fact]
    public void Validate_JpegNamedFileWithNonImageBytes_ReturnsContentDoesNotMatchFormat()
    {
        var fakeBytes = "this is not actually a jpeg file at all!"u8.ToArray();

        using var content = CreateStream(fakeBytes);

        var result = IdCardImageValidator.Validate(
            "image/jpeg",
            "id-card.jpg",
            content.Length,
            content);

        Assert.Equal(IdCardImageValidationResult.ContentDoesNotMatchFormat, result);
    }

    [Fact]
    public void Validate_PngNamedFileWithJpegBytes_ReturnsContentDoesNotMatchFormat()
    {
        using var content = CreateStream(ValidJpegBytes);

        var result = IdCardImageValidator.Validate(
            "image/png",
            "id-card.png",
            content.Length,
            content);

        Assert.Equal(IdCardImageValidationResult.ContentDoesNotMatchFormat, result);
    }

    [Fact]
    public void Validate_ContentShorterThanHeaderSize_ReturnsContentDoesNotMatchFormat()
    {
        byte[] tooShort = [0xFF, 0xD8, 0xFF];

        using var content = CreateStream(tooShort);

        var result = IdCardImageValidator.Validate(
            "image/jpeg",
            "id-card.jpg",
            content.Length,
            content);

        Assert.Equal(IdCardImageValidationResult.ContentDoesNotMatchFormat, result);
    }

    [Fact]
    public void Validate_SeekableStream_ResetsPositionAfterSniffing()
    {
        using var content = CreateStream(ValidJpegBytes);

        IdCardImageValidator.Validate(
            "image/jpeg",
            "id-card.jpg",
            content.Length,
            content);

        Assert.Equal(0, content.Position);
    }

    [Fact]
    public void Validate_SeekableStream_ContentStillFullyReadableAfterValidation()
    {
        using var content = CreateStream(ValidJpegBytes);

        IdCardImageValidator.Validate(
            "image/jpeg",
            "id-card.jpg",
            content.Length,
            content);

        using var reader = new MemoryStream();
        content.CopyTo(reader);

        Assert.Equal(ValidJpegBytes, reader.ToArray());
    }

    private static MemoryStream CreateStream(byte[] bytes)
        => new(bytes);
}
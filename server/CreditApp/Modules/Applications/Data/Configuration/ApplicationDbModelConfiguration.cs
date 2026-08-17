namespace CreditApp.Modules.Applications.Data.Configuration;

using CreditApp.Shared.Settings;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.Extensions.Options;
using Models;
using Shared;

using static CreditApp.Shared.Constants.Validation;
using static Shared.Constants.Validation;

public sealed class ApplicationDbModelConfiguration(
    IOptions<EgnEncryptionSettings> egnEncryptionSettings) : IEntityTypeConfiguration<ApplicationDbModel>
{
    public void Configure(EntityTypeBuilder<ApplicationDbModel> builder)
    {
        var encryptionKey = egnEncryptionSettings.Value.Key;

        builder
            .ToTable("Applications");

        builder
            .Property(static a => a.IsDeleted)
            .HasDefaultValue(false);

        builder
            .HasQueryFilter(static a => !a.IsDeleted);

        builder
            .HasIndex(static a => a.IsDeleted);

        builder
           .Property(static a => a.FirstName)
           .IsRequired()
           .HasMaxLength(NameMaxLength);

        builder
            .Property(static a => a.LastName)
            .IsRequired()
            .HasMaxLength(NameMaxLength);

        builder
            .Property(a => a.Egn)
            .IsRequired()
            .HasConversion(
                plainText => EgnEncryptor.Encrypt(plainText, encryptionKey),
                cipherText => EgnEncryptor.Decrypt(cipherText, encryptionKey))
            .HasMaxLength(EgnEncryptedMaxLength);

        builder
            .Property(static a => a.Phone)
            .IsRequired()
            .HasMaxLength(PhoneMaxLength);

        builder
            .Property(static a => a.Email)
            .IsRequired()
            .HasMaxLength(EmailMaxLength);

        builder
            .Property(static a => a.RequestedAmount)
            .HasColumnType("decimal(18,2)");

        builder
            .Property(static a => a.IdCardImagePath)
            .IsRequired()
            .HasMaxLength(ImagePathMaxLength);

        builder
            .Property(static a => a.ReviewNote)
            .HasMaxLength(ReviewNoteMaxLength);

        builder
            .HasIndex(static a => a.Status);
    }
}

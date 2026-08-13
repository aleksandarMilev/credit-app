namespace CreditApp.Modules.Identity.Data.Configuration;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Models;

public sealed class UserDbModelConfiguration : IEntityTypeConfiguration<UserDbModel>
{
    public void Configure(EntityTypeBuilder<UserDbModel> builder)
    {
        builder
            .Property(static u => u.IsDeleted)
            .HasDefaultValue(false);

        builder
            .HasQueryFilter(static u => !u.IsDeleted);

        builder
            .HasIndex(static u => u.IsDeleted);
    }
}

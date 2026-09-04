namespace CreditApp.Modules.InterestRate.Data.Configuration;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Models;

public sealed class InterestRateDbModelConfiguration : IEntityTypeConfiguration<InterestRateDbModel>
{
    public void Configure(EntityTypeBuilder<InterestRateDbModel> builder)
        => builder
            .Property(static r => r.AnnualRatePercent)
            .HasColumnType("decimal(5,2)");
}
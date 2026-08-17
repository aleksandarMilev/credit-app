namespace CreditApp.Shared.Data;

using System.Reflection;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Models.Base;
using Modules.Applications.Data.Configuration;
using Modules.Applications.Data.Models;
using Modules.Identity.Data.Models;
using Services.CurrentUser;
using Settings;

public class CreditAppDbContext(
    DbContextOptions<CreditAppDbContext> options,
    ICurrentUserService userService,
    IOptions<EgnEncryptionSettings> egnEncryptionSettings) : IdentityDbContext<UserDbModel>(options)
{
    public DbSet<ApplicationDbModel> Applications { get; init; } 

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        this.ApplyAuditInfo();

        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default)
    {
        this.ApplyAuditInfo();

        return base.SaveChangesAsync(
            acceptAllChangesOnSuccess,
            cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(
            Assembly.GetExecutingAssembly(),
            type => type != typeof(ApplicationDbModelConfiguration));

        modelBuilder.ApplyConfiguration(
            new ApplicationDbModelConfiguration(egnEncryptionSettings));
    }

    private void ApplyAuditInfo()
        => this.ChangeTracker
            .Entries()
            .ToList()
            .ForEach(entry =>
            {
                var utcNow = DateTime.UtcNow;
                var username = userService.GetUsername();

                if (entry.State == EntityState.Deleted &&
                    entry.Entity is IDeletableEntity deletableEntity)
                {
                    deletableEntity.DeletedOn = utcNow;
                    deletableEntity.DeletedBy = username;
                    deletableEntity.IsDeleted = true;

                    entry.State = EntityState.Modified;

                    return;
                }

                if (entry.Entity is IDeletableEntity entity)
                {
                    if (entry.State == EntityState.Added)
                    {
                        entity.CreatedOn = utcNow;
                        entity.CreatedBy = username!;
                    }
                    else if (entry.State == EntityState.Modified)
                    {
                        entity.ModifiedOn = utcNow;
                        entity.ModifiedBy = username;
                    }
                }
            });
}

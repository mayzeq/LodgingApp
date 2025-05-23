using LodgingApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LodgingApp.Data
{
    public class AppDbContext : DbContext
    {
        public DbSet<User> Users { get; set; }
        public DbSet<Admin> Admins { get; set; }
        public DbSet<Lodging> Lodgings { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Payment> Payments { get; set; }

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            foreach (var entity in modelBuilder.Model.GetEntityTypes())
            {
                entity.SetTableName(entity.GetTableName());
                foreach (var property in entity.GetProperties())
                    property.SetColumnName(property.Name);
            }

            modelBuilder.Entity<Admin>()
                .HasMany(a => a.Lodgings)
                .WithOne(l => l.Admin)
                .HasForeignKey(l => l.AdminId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<User>()
                .HasMany(u => u.Bookings)
                .WithOne(b => b.User)
                .HasForeignKey(b => b.UserId);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Lodging>()
                .Property(l => l.Status)
                .HasDefaultValue(LodgingStatus.Аvailable);

            modelBuilder.Entity<Admin>()
                .Property(a => a.Type)
                .HasConversion<string>()
                .HasMaxLength(20);
        }
    }
}

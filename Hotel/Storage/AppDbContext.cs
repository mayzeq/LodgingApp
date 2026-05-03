using Microsoft.EntityFrameworkCore;
using Hotel.Domain.Entities;

namespace Hotel.Data
{
    public class AppDbContext : DbContext
    {
        public DbSet<User> Users { get; set; }
        public DbSet<Guest> Guests { get; set; }
        public DbSet<RoomType> RoomTypes { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Service> Services { get; set; }
        public DbSet<BookingService> BookingServices { get; set; }

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>().ToTable("User");
            modelBuilder.Entity<Guest>().ToTable("Guest");
            modelBuilder.Entity<RoomType>().ToTable("RoomType");
            modelBuilder.Entity<Room>().ToTable("Room");
            modelBuilder.Entity<Order>().ToTable("Order");
            modelBuilder.Entity<Booking>().ToTable("Booking");
            modelBuilder.Entity<Payment>().ToTable("Payment");
            modelBuilder.Entity<Service>().ToTable("Service");
            modelBuilder.Entity<BookingService>().ToTable("BookingService");

            modelBuilder.Entity<User>()
                .HasIndex(x => x.Login)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(x => x.Email)
                .IsUnique();

            modelBuilder.Entity<Guest>()
                .HasOne(x => x.User)
                .WithMany(x => x.Guests)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Room>()
                .HasOne(x => x.RoomType)
                .WithMany(x => x.Rooms)
                .HasForeignKey(x => x.RoomTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Order>()
                .HasOne(x => x.User)
                .WithMany(x => x.Orders)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Booking>()
                .HasOne(x => x.Guest)
                .WithMany(x => x.Bookings)
                .HasForeignKey(x => x.GuestId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Booking>()
                .HasOne(x => x.Room)
                .WithMany(x => x.Bookings)
                .HasForeignKey(x => x.RoomId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Booking>()
                .HasOne(x => x.Order)
                .WithMany(x => x.Bookings)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Payment>()
                .HasOne(x => x.Order)
                .WithOne(x => x.Payment)
                .HasForeignKey<Payment>(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<BookingService>()
                .HasOne(x => x.Booking)
                .WithMany(x => x.BookingServices)
                .HasForeignKey(x => x.BookingId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<BookingService>()
                .HasOne(x => x.Service)
                .WithMany(x => x.BookingServices)
                .HasForeignKey(x => x.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<User>()
                .Property(x => x.Role)
                .HasDefaultValue("guest");

            modelBuilder.Entity<User>()
                .Property(x => x.CreatedAt)
                .HasDefaultValueSql("NOW()");
        }
    }
}

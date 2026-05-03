using Hotel.Data;
using Hotel.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Hotel.Storage;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        // Seed once (idempotent): add missing baseline entities, don't duplicate.

        var admin = await db.Users.FirstOrDefaultAsync(x => x.Login == "admin");
        if (admin is null)
        {
            admin = new User
            {
                Login = "admin",
                Password = "Admin123!",
                Email = "admin@hotel.local",
                Phone = "+7 (900) 000-00-01",
                Role = "admin"
            };
            db.Users.Add(admin);
        }

        var guestUser = await db.Users.FirstOrDefaultAsync(x => x.Login == "guest");
        if (guestUser is null)
        {
            guestUser = new User
            {
                Login = "guest",
                Password = "Guest123!",
                Email = "guest@hotel.local",
                Phone = "+7 (900) 000-00-02",
                Role = "guest"
            };
            db.Users.Add(guestUser);
        }

        await db.SaveChangesAsync();

        var guestProfile = await db.Guests.FirstOrDefaultAsync(x => x.UserId == guestUser.UserId);
        if (guestProfile is null)
        {
            guestProfile = new Guest
            {
                UserId = guestUser.UserId,
                Surname = "Иванов",
                FirstName = "Иван",
                Patronymic = "Иванович",
                Birthdate = new DateOnly(1998, 4, 12),
                Passport = "4510 123456"
            };
            db.Guests.Add(guestProfile);
            await db.SaveChangesAsync();
        }

        var standard = await db.RoomTypes.FirstOrDefaultAsync(x => x.TypeName == "Standard");
        if (standard is null)
        {
            standard = new RoomType
            {
                TypeName = "Standard",
                Description = "Уютный номер для 1–2 гостей",
                MaxGuests = 2,
                PricePerNight = 3490m
            };
            db.RoomTypes.Add(standard);
        }
        var deluxe = await db.RoomTypes.FirstOrDefaultAsync(x => x.TypeName == "Deluxe");
        if (deluxe is null)
        {
            deluxe = new RoomType
            {
                TypeName = "Deluxe",
                Description = "Улучшенный номер с рабочей зоной",
                MaxGuests = 3,
                PricePerNight = 5490m
            };
            db.RoomTypes.Add(deluxe);
        }
        var suite = await db.RoomTypes.FirstOrDefaultAsync(x => x.TypeName == "Suite");
        if (suite is null)
        {
            suite = new RoomType
            {
                TypeName = "Suite",
                Description = "Номер повышенной комфортности",
                MaxGuests = 4,
                PricePerNight = 8990m
            };
            db.RoomTypes.Add(suite);
        }

        await db.SaveChangesAsync();

        async Task EnsureRoom(string number, int floor, RoomType type, string photo, string status = "available")
        {
            var exists = await db.Rooms.AnyAsync(x => x.RoomNumber == number);
            if (exists) return;
            db.Rooms.Add(new Room { RoomTypeId = type.RoomTypeId, RoomNumber = number, Floor = floor, Status = status, PhotoUrl = photo });
        }

        await EnsureRoom("101", 1, standard, "/images/room-standard.svg");
        await EnsureRoom("102", 1, standard, "/images/room-standard.svg");
        await EnsureRoom("201", 2, deluxe, "/images/room-deluxe.svg");
        await EnsureRoom("202", 2, deluxe, "/images/room-deluxe.svg");
        await EnsureRoom("301", 3, suite, "/images/room-suite.svg");
        await EnsureRoom("302", 3, suite, "/images/room-suite.svg");
        await db.SaveChangesAsync();

        async Task EnsureService(string name, string? description, decimal price, bool included)
        {
            var exists = await db.Services.AnyAsync(x => x.ServiceName == name);
            if (exists) return;
            db.Services.Add(new Service { ServiceName = name, Description = description, Price = price, IsIncluded = included });
        }

        await EnsureService("Завтрак", "Шведский стол", 650m, false);
        await EnsureService("Поздний выезд", "До 18:00 при наличии мест", 1200m, false);
        await EnsureService("Трансфер", "Аэропорт ↔ отель", 2500m, false);
        await EnsureService("Бассейн", "Посещение бассейна (1 час)", 900m, false);
        await EnsureService("Массаж", "Сеанс 45 минут", 2200m, false);
        await db.SaveChangesAsync();

        // Create one demo booking if the guest has none.
        var hasBooking = await db.Bookings.AnyAsync(x => x.GuestId == guestProfile.GuestId);
        if (!hasBooking)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
            var room101 = await db.Rooms.FirstAsync(x => x.RoomNumber == "101");

            var order1 = new Order { UserId = guestUser.UserId, TotalAmount = 2 * standard.PricePerNight, Status = "paid" };
            db.Orders.Add(order1);
            await db.SaveChangesAsync();

            var booking1 = new Booking
            {
                GuestId = guestProfile.GuestId,
                RoomId = room101.RoomId,
                OrderId = order1.OrderId,
                CheckInDate = today.AddDays(5),
                CheckOutDate = today.AddDays(7),
                TotalPrice = 2 * standard.PricePerNight,
                Status = "confirmed"
            };
            db.Bookings.Add(booking1);
            room101.Status = "booked";

            var payment1 = new Payment
            {
                OrderId = order1.OrderId,
                Amount = order1.TotalAmount,
                PaymentMethod = "card",
                TransactionId = Guid.NewGuid().ToString("N"),
                Status = "confirmed"
            };
            db.Payments.Add(payment1);

            await db.SaveChangesAsync();
        }
    }
}


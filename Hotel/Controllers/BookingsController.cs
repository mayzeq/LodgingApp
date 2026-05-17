using Hotel.Data;
using Hotel.Domain.Entities;
using Hotel.Domain.ValueObjects;
using Hotel.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hotel.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookingsController : ControllerBase
{
    private readonly AppDbContext _db;

    public BookingsController(AppDbContext db)
    {
        _db = db;
    }

    private IQueryable<Booking> BookingDetailQuery()
    {
        return _db.Bookings
            .Include(x => x.Guest!)
            .ThenInclude(g => g.User)
            .Include(x => x.Room!)
            .ThenInclude(x => x.RoomType)
            .Include(x => x.Payment)
            .Include(x => x.BookingGuests)
            .ThenInclude(x => x.Guest)
            .Include(x => x.BookingServices)
            .ThenInclude(x => x.Service)
            .Include(x => x.BookingServices)
            .ThenInclude(x => x.Guest);
    }

    private async Task<Booking?> LoadBookingAsync(int bookingId)
    {
        return await BookingDetailQuery().FirstOrDefaultAsync(x => x.BookingId == bookingId);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBookingRequest request)
    {
        var requestedGuestIds = (request.GuestIds ?? new List<int>())
            .Where(x => x > 0)
            .Distinct()
            .ToList();

        if (requestedGuestIds.Count == 0)
        {
            requestedGuestIds = new List<int> { request.GuestId };
        }

        var guests = await _db.Guests
            .Where(x => requestedGuestIds.Contains(x.GuestId))
            .ToListAsync();

        if (guests.Count != requestedGuestIds.Count)
        {
            return NotFound("Один или несколько гостей не найдены.");
        }

        var primaryGuestId = requestedGuestIds[0];
        var primaryGuest = guests.First(x => x.GuestId == primaryGuestId);

        var room = await _db.Rooms.Include(x => x.RoomType).FirstOrDefaultAsync(x => x.RoomId == request.RoomId);
        if (room is null) return NotFound("Номер не найден.");

        if (request.CheckOutDate <= request.CheckInDate)
        {
            return BadRequest(
                "Минимальный срок — одна ночь: дата выезда указывает первый день после последней ночи и должна быть минимум на один календарный день позже даты заезда.");
        }

        var capacity = room.RoomType?.MaxGuests ?? 0;
        if (capacity > 0 && requestedGuestIds.Count > capacity)
        {
            return BadRequest($"Превышено максимальное количество гостей для типа номера: {capacity}.");
        }

        var overlaps = await _db.Bookings.AnyAsync(x =>
            x.RoomId == request.RoomId &&
            x.Status != "cancelled" &&
            request.CheckInDate < x.CheckOutDate &&
            request.CheckOutDate > x.CheckInDate);

        if (overlaps) return Conflict("Номер уже забронирован на выбранные даты.");

        var nights = request.CheckOutDate.DayNumber - request.CheckInDate.DayNumber;
        var totalPrice = nights * (room.RoomType?.PricePerNight ?? 0m);

        var booking = new Booking
        {
            GuestId = primaryGuestId,
            RoomId = request.RoomId,
            CheckInDate = request.CheckInDate,
            CheckOutDate = request.CheckOutDate,
            TotalPrice = totalPrice,
            Status = "confirmed"
        };

        _db.Bookings.Add(booking);
        await _db.SaveChangesAsync();

        var links = requestedGuestIds.Select(id => new BookingGuest
        {
            BookingId = booking.BookingId,
            GuestId = id,
            IsPrimary = id == primaryGuestId
        });
        _db.BookingGuests.AddRange(links);
        await _db.SaveChangesAsync();

        var created = await LoadBookingAsync(booking.BookingId);
        return Ok(BookingMappings.ToBookingDetailDto(created!));
    }

    [HttpPatch("{bookingId:int}/cancel")]
    public async Task<IActionResult> Cancel(int bookingId)
    {
        var booking = await _db.Bookings
            .Include(x => x.Room)
            .Include(x => x.Payment)
            .FirstOrDefaultAsync(x => x.BookingId == bookingId);
        if (booking is null) return NotFound("Бронирование не найдено.");

        if (booking.Status == "cancelled")
        {
            return Conflict("Бронирование уже отменено.");
        }

        booking.Status = "cancelled";

        if (booking.Payment is not null && booking.Payment.Status != "confirmed")
        {
            booking.Payment.Status = "cancelled";
        }

        await _db.SaveChangesAsync();
        return Ok(new
        {
            message = "Бронирование отменено.",
            note = "Позиции услуг сохранены в истории; неподтверждённый платёж отменён. Номер снова доступен на эти даты."
        });
    }

    [HttpGet("by-user/{userId:int}")]
    public async Task<IActionResult> GetByUser(int userId)
    {
        var data = await BookingDetailQuery()
            .Where(x =>
                (x.Guest != null && x.Guest.UserId == userId) ||
                x.BookingGuests.Any(bg => bg.Guest != null && bg.Guest.UserId == userId))
            .OrderByDescending(x => x.BookingDatetime)
            .ToListAsync();

        return Ok(data.Select(BookingMappings.ToBookingDetailDto).ToList());
    }

    [HttpGet("{bookingId:int}")]
    public async Task<IActionResult> GetById(int bookingId)
    {
        var booking = await LoadBookingAsync(bookingId);

        if (booking is null) return NotFound("Бронирование не найдено.");
        return Ok(BookingMappings.ToBookingDetailDto(booking));
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] int? roomId, [FromQuery] int? userId, [FromQuery] int? bookingId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate)
    {
        var query = BookingDetailQuery().AsQueryable();

        if (bookingId.HasValue)
        {
            query = query.Where(x => x.BookingId == bookingId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(x => x.Status == status);
        }

        if (roomId.HasValue)
        {
            query = query.Where(x => x.RoomId == roomId.Value);
        }

        if (userId.HasValue)
        {
            query = query.Where(x =>
                (x.Guest != null && x.Guest.UserId == userId.Value) ||
                x.BookingGuests.Any(bg => bg.Guest != null && bg.Guest.UserId == userId.Value));
        }

        if (fromDate.HasValue)
        {
            query = query.Where(x => x.CheckInDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(x => x.CheckOutDate <= toDate.Value);
        }

        var data = await query.OrderByDescending(x => x.BookingDatetime).ToListAsync();
        return Ok(data.Select(BookingMappings.ToBookingDetailDto).ToList());
    }
}

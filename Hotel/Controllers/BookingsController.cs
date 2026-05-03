using Hotel.Data;
using Hotel.Domain.Entities;
using Hotel.Domain.ValueObjects;
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

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBookingRequest request)
    {
        var guest = await _db.Guests.FirstOrDefaultAsync(x => x.GuestId == request.GuestId);
        if (guest is null) return NotFound("Гость не найден.");

        var room = await _db.Rooms.Include(x => x.RoomType).FirstOrDefaultAsync(x => x.RoomId == request.RoomId);
        if (room is null) return NotFound("Номер не найден.");

        if (request.CheckOutDate <= request.CheckInDate)
        {
            return BadRequest("Дата выезда должна быть позже даты заезда.");
        }

        var overlaps = await _db.Bookings.AnyAsync(x =>
            x.RoomId == request.RoomId &&
            x.Status != "cancelled" &&
            request.CheckInDate < x.CheckOutDate &&
            request.CheckOutDate > x.CheckInDate);

        if (overlaps) return Conflict("Номер уже забронирован на выбранные даты.");

        var nights = request.CheckOutDate.DayNumber - request.CheckInDate.DayNumber;
        var totalPrice = nights * (room.RoomType?.PricePerNight ?? 0m);

        var order = new Order
        {
            UserId = guest.UserId,
            TotalAmount = totalPrice,
            Status = "created"
        };

        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        var booking = new Booking
        {
            GuestId = request.GuestId,
            RoomId = request.RoomId,
            OrderId = order.OrderId,
            CheckInDate = request.CheckInDate,
            CheckOutDate = request.CheckOutDate,
            TotalPrice = totalPrice,
            Status = "confirmed"
        };

        _db.Bookings.Add(booking);
        await _db.SaveChangesAsync();

        return Ok(booking);
    }

    [HttpPatch("{bookingId:int}/cancel")]
    public async Task<IActionResult> Cancel(int bookingId)
    {
        var booking = await _db.Bookings.Include(x => x.Room).FirstOrDefaultAsync(x => x.BookingId == bookingId);
        if (booking is null) return NotFound("Бронирование не найдено.");

        booking.Status = "cancelled";
        await _db.SaveChangesAsync();
        return Ok("Бронирование отменено.");
    }

    [HttpGet("by-user/{userId:int}")]
    public async Task<IActionResult> GetByUser(int userId)
    {
        var data = await _db.Bookings
            .Include(x => x.Guest)
            .Include(x => x.Room!)
            .ThenInclude(x => x.RoomType)
            .Include(x => x.Order!)
            .ThenInclude(x => x.Payment)
            .Include(x => x.BookingServices)
            .ThenInclude(x => x.Service)
            .Where(x => x.Guest != null && x.Guest!.UserId == userId)
            .OrderByDescending(x => x.BookingDatetime)
            .ToListAsync();
        return Ok(data);
    }

    [HttpGet("{bookingId:int}")]
    public async Task<IActionResult> GetById(int bookingId)
    {
        var booking = await _db.Bookings
            .Include(x => x.Room!)
            .ThenInclude(x => x.RoomType)
            .Include(x => x.Order!)
            .ThenInclude(x => x.Payment)
            .Include(x => x.BookingServices)
            .ThenInclude(x => x.Service)
            .FirstOrDefaultAsync(x => x.BookingId == bookingId);

        if (booking is null) return NotFound("Бронирование не найдено.");
        return Ok(booking);
    }

    // Admin: list all bookings
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
    {
        var query = _db.Bookings
            .Include(x => x.Guest!)
            .ThenInclude(x => x.User)
            .Include(x => x.Room!)
            .ThenInclude(x => x.RoomType)
            .Include(x => x.Order!)
            .ThenInclude(x => x.Payment)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(x => x.Status == status);
        }

        var data = await query.OrderByDescending(x => x.BookingDatetime).ToListAsync();
        return Ok(data);
    }
}

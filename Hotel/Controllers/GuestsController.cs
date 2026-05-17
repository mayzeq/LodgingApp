using Hotel.Data;
using Hotel.Domain.Entities;
using Hotel.Domain.ValueObjects;
using Hotel.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hotel.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GuestsController : ControllerBase
{
    private readonly AppDbContext _db;

    public GuestsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateGuestRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.UserId == request.UserId);
        if (user is null) return NotFound("Пользователь не найден.");

        var passportExists = await _db.Guests.AnyAsync(x => x.Passport == request.Passport);
        if (passportExists) return Conflict("Гость с таким паспортом уже существует.");

        var guest = new Guest
        {
            UserId = request.UserId,
            Surname = request.Surname,
            FirstName = request.FirstName,
            Patronymic = request.Patronymic,
            Birthdate = request.Birthdate,
            Passport = request.Passport
        };

        _db.Guests.Add(guest);
        await _db.SaveChangesAsync();
        return Ok(BookingMappings.ToGuestDto(guest));
    }

    [HttpPut("{guestId:int}")]
    public async Task<IActionResult> Update(int guestId, [FromBody] CreateGuestRequest request)
    {
        var guest = await _db.Guests.FirstOrDefaultAsync(x => x.GuestId == guestId);
        if (guest is null) return NotFound("Гость не найден.");

        var user = await _db.Users.FirstOrDefaultAsync(x => x.UserId == request.UserId);
        if (user is null) return NotFound("Пользователь не найден.");

        var passportExists = await _db.Guests.AnyAsync(x => x.Passport == request.Passport && x.GuestId != guestId);
        if (passportExists) return Conflict("Гость с таким паспортом уже существует.");

        guest.UserId = request.UserId;
        guest.Surname = request.Surname;
        guest.FirstName = request.FirstName;
        guest.Patronymic = request.Patronymic;
        guest.Birthdate = request.Birthdate;
        guest.Passport = request.Passport;

        await _db.SaveChangesAsync();
        return Ok(BookingMappings.ToGuestDto(guest));
    }

    [HttpGet("{guestId:int}")]
    public async Task<IActionResult> GetById(int guestId)
    {
        var guest = await _db.Guests
            .FirstOrDefaultAsync(x => x.GuestId == guestId);
        if (guest is null) return NotFound("Гость не найден.");
        return Ok(BookingMappings.ToGuestDto(guest));
    }

    [HttpGet("by-user/{userId:int}")]
    public async Task<IActionResult> GetByUser(int userId)
    {
        var guests = await _db.Guests
            .Where(x => x.UserId == userId)
            .OrderBy(x => x.GuestId)
            .ToListAsync();
        return Ok(guests.Select(BookingMappings.ToGuestDto).ToList());
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? userId)
    {
        var query = _db.Guests.AsQueryable();
        if (userId.HasValue)
        {
            query = query.Where(x => x.UserId == userId.Value);
        }

        var guests = await query.OrderBy(x => x.GuestId).ToListAsync();
        return Ok(guests.Select(BookingMappings.ToGuestDto).ToList());
    }

    [HttpDelete("{guestId:int}")]
    public async Task<IActionResult> Delete(int guestId, [FromQuery] int userId)
    {
        var guest = await _db.Guests.FirstOrDefaultAsync(x => x.GuestId == guestId);
        if (guest is null) return NotFound("Гость не найден.");

        if (guest.UserId != userId)
            return StatusCode(403, "Недостаточно прав.");

        var inBookings = await _db.Bookings.AnyAsync(x => x.GuestId == guestId);
        var inBookingGuests = await _db.BookingGuests.AnyAsync(x => x.GuestId == guestId);
        if (inBookings || inBookingGuests)
            return Conflict("Нельзя удалить гостя, участвующего в бронировании.");

        _db.Guests.Remove(guest);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Гость удален." });
    }
}

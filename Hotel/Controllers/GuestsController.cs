using Hotel.Data;
using Hotel.Domain.Entities;
using Hotel.Domain.ValueObjects;
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

        var guest = await _db.Guests.FirstOrDefaultAsync(x => x.UserId == request.UserId);
        if (guest is null)
        {
            guest = new Guest { UserId = request.UserId };
            _db.Guests.Add(guest);
        }

        guest.Surname = request.Surname;
        guest.FirstName = request.FirstName;
        guest.Patronymic = request.Patronymic;
        guest.Birthdate = request.Birthdate;
        guest.Passport = request.Passport;

        await _db.SaveChangesAsync();
        return Ok(guest);
    }

    [HttpGet("by-user/{userId:int}")]
    public async Task<IActionResult> GetByUser(int userId)
    {
        var guests = await _db.Guests.Where(x => x.UserId == userId).ToListAsync();
        return Ok(guests);
    }
}

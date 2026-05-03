using Hotel.Data;
using Hotel.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hotel.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoomsController : ControllerBase
{
    private readonly AppDbContext _db;

    public RoomsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("types")]
    public async Task<IActionResult> GetRoomTypes()
    {
        var data = await _db.RoomTypes.OrderBy(x => x.RoomTypeId).ToListAsync();
        return Ok(data);
    }

    [HttpPost("types")]
    public async Task<IActionResult> CreateRoomType([FromBody] RoomType roomType)
    {
        _db.RoomTypes.Add(roomType);
        await _db.SaveChangesAsync();
        return Ok(roomType);
    }

    [HttpGet]
    public async Task<IActionResult> GetRooms([FromQuery] DateOnly? checkInDate, [FromQuery] DateOnly? checkOutDate)
    {
        var rooms = await _db.Rooms
            .Include(x => x.RoomType)
            .OrderBy(x => x.RoomId)
            .ToListAsync();

        // If dates are provided, compute availability for the given range (time-based availability).
        if (checkInDate is null || checkOutDate is null || checkOutDate <= checkInDate)
        {
            return Ok(rooms);
        }

        var start = checkInDate.Value;
        var end = checkOutDate.Value;

        var roomIds = rooms.Select(x => x.RoomId).ToList();
        var busyRoomIds = await _db.Bookings
            .Where(b =>
                roomIds.Contains(b.RoomId) &&
                b.Status != "cancelled" &&
                start < b.CheckOutDate &&
                end > b.CheckInDate)
            .Select(b => b.RoomId)
            .Distinct()
            .ToListAsync();

        var result = rooms.Select(r => new
        {
            r.RoomId,
            r.RoomTypeId,
            r.RoomNumber,
            r.Floor,
            r.Status,
            r.PhotoUrl,
            r.RoomType,
            IsAvailable = !busyRoomIds.Contains(r.RoomId)
        });

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateRoom([FromBody] Room room)
    {
        var roomTypeExists = await _db.RoomTypes.AnyAsync(x => x.RoomTypeId == room.RoomTypeId);
        if (!roomTypeExists) return NotFound("Тип номера не найден.");

        _db.Rooms.Add(room);
        await _db.SaveChangesAsync();
        return Ok(room);
    }

    [HttpPut("{roomId:int}")]
    public async Task<IActionResult> UpdateRoom(int roomId, [FromBody] Room room)
    {
        var entity = await _db.Rooms.FirstOrDefaultAsync(x => x.RoomId == roomId);
        if (entity is null) return NotFound("Номер не найден.");

        var roomTypeExists = await _db.RoomTypes.AnyAsync(x => x.RoomTypeId == room.RoomTypeId);
        if (!roomTypeExists) return NotFound("Тип номера не найден.");

        entity.RoomTypeId = room.RoomTypeId;
        entity.RoomNumber = room.RoomNumber;
        entity.Floor = room.Floor;
        entity.Status = room.Status;
        entity.PhotoUrl = room.PhotoUrl;

        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("{roomId:int}")]
    public async Task<IActionResult> DeleteRoom(int roomId)
    {
        var entity = await _db.Rooms.FirstOrDefaultAsync(x => x.RoomId == roomId);
        if (entity is null) return NotFound("Номер не найден.");

        var hasBookings = await _db.Bookings.AnyAsync(x => x.RoomId == roomId);
        if (hasBookings) return Conflict("Нельзя удалить номер: есть связанные бронирования.");

        _db.Rooms.Remove(entity);
        await _db.SaveChangesAsync();
        return Ok("Номер удален.");
    }
}

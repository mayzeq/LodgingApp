using Hotel.Data;
using Hotel.Domain.Entities;
using Hotel.Dtos;
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
        return Ok(data.Select(BookingMappings.ToRoomTypeDto).ToList());
    }

    [HttpPost("types")]
    public async Task<IActionResult> CreateRoomType([FromBody] RoomType roomType)
    {
        _db.RoomTypes.Add(roomType);
        await _db.SaveChangesAsync();
        return Ok(BookingMappings.ToRoomTypeDto(roomType));
    }

    [HttpPut("types/{roomTypeId:int}")]
    public async Task<IActionResult> UpdateRoomType(int roomTypeId, [FromBody] RoomType body)
    {
        var entity = await _db.RoomTypes.FirstOrDefaultAsync(x => x.RoomTypeId == roomTypeId);
        if (entity is null) return NotFound("Тип номера не найден.");

        entity.TypeName = body.TypeName;
        entity.Description = body.Description;
        entity.MaxGuests = body.MaxGuests;
        entity.PricePerNight = body.PricePerNight;
        await _db.SaveChangesAsync();
        return Ok(BookingMappings.ToRoomTypeDto(entity));
    }

    [HttpDelete("types/{roomTypeId:int}")]
    public async Task<IActionResult> DeleteRoomType(int roomTypeId)
    {
        var entity = await _db.RoomTypes.FirstOrDefaultAsync(x => x.RoomTypeId == roomTypeId);
        if (entity is null) return NotFound("Тип номера не найден.");

        var used = await _db.Rooms.AnyAsync(x => x.RoomTypeId == roomTypeId);
        if (used) return Conflict("Нельзя удалить тип: есть номера с этим типом.");

        _db.RoomTypes.Remove(entity);
        await _db.SaveChangesAsync();
        return Ok("Тип номера удален.");
    }

    [HttpGet]
    public async Task<IActionResult> GetRooms([FromQuery] DateOnly? checkInDate, [FromQuery] DateOnly? checkOutDate)
    {
        var rooms = await _db.Rooms
            .Include(x => x.RoomType)
            .OrderBy(x => x.RoomId)
            .ToListAsync();

        if (checkInDate is null || checkOutDate is null || checkOutDate <= checkInDate)
        {
            return Ok(rooms.Select(r => BookingMappings.ToRoomListItem(r)).ToList());
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

        var result = rooms.Select(r => BookingMappings.ToRoomListItem(r, !busyRoomIds.Contains(r.RoomId)));
        return Ok(result.ToList());
    }

    [HttpPost]
    public async Task<IActionResult> CreateRoom([FromBody] Room room)
    {
        var roomTypeExists = await _db.RoomTypes.AnyAsync(x => x.RoomTypeId == room.RoomTypeId);
        if (!roomTypeExists) return NotFound("Тип номера не найден.");

        _db.Rooms.Add(room);
        await _db.SaveChangesAsync();

        var created = await _db.Rooms.Include(x => x.RoomType).FirstAsync(x => x.RoomId == room.RoomId);
        return Ok(BookingMappings.ToRoomDto(created));
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

        var updated = await _db.Rooms.Include(x => x.RoomType).FirstAsync(x => x.RoomId == roomId);
        return Ok(BookingMappings.ToRoomDto(updated));
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

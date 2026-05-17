using Hotel.Data;
using Hotel.Domain.Entities;
using Hotel.Domain.ValueObjects;
using Hotel.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hotel.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicesController : ControllerBase
{
    private readonly AppDbContext _db;

    public ServicesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var data = await _db.Services.OrderBy(x => x.ServiceId).ToListAsync();
        return Ok(data.Select(BookingMappings.ToServiceBriefDto).ToList());
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Service service)
    {
        _db.Services.Add(service);
        await _db.SaveChangesAsync();
        return Ok(BookingMappings.ToServiceBriefDto(service));
    }

    [HttpPut("{serviceId:int}")]
    public async Task<IActionResult> Update(int serviceId, [FromBody] Service service)
    {
        var entity = await _db.Services.FirstOrDefaultAsync(x => x.ServiceId == serviceId);
        if (entity is null) return NotFound("Услуга не найдена.");

        entity.ServiceName = service.ServiceName;
        entity.Description = service.Description;
        entity.Price = service.Price;
        entity.IsIncluded = service.IsIncluded;
        await _db.SaveChangesAsync();
        return Ok(BookingMappings.ToServiceBriefDto(entity));
    }

    [HttpDelete("{serviceId:int}")]
    public async Task<IActionResult> Delete(int serviceId)
    {
        var entity = await _db.Services.FirstOrDefaultAsync(x => x.ServiceId == serviceId);
        if (entity is null) return NotFound("Услуга не найдена.");

        var used = await _db.BookingServices.AnyAsync(x => x.ServiceId == serviceId);
        if (used) return Conflict("Нельзя удалить услугу: она используется в бронированиях.");

        _db.Services.Remove(entity);
        await _db.SaveChangesAsync();
        return Ok("Услуга удалена.");
    }

    [HttpPost("booking-link")]
    public async Task<IActionResult> AddToBooking([FromBody] AddBookingServiceRequest request)
    {
        var booking = await _db.Bookings
            .Include(x => x.BookingGuests)
            .FirstOrDefaultAsync(x => x.BookingId == request.BookingId);
        if (booking is null) return NotFound("Бронирование не найдено.");

        var service = await _db.Services.FirstOrDefaultAsync(x => x.ServiceId == request.ServiceId);
        if (service is null) return NotFound("Услуга не найдена.");

        if (request.GuestId.HasValue)
        {
            var guestInBooking = booking.BookingGuests.Any(x => x.GuestId == request.GuestId.Value);
            if (!guestInBooking)
            {
                return BadRequest("Указанный гость не входит в выбранное бронирование.");
            }
        }

        var totalCost = service.Price * request.Quantity;
        var link = new BookingService
        {
            BookingId = request.BookingId,
            ServiceId = request.ServiceId,
            GuestId = request.GuestId,
            Quantity = request.Quantity,
            TotalCost = totalCost
        };

        _db.BookingServices.Add(link);
        booking.TotalPrice += totalCost;

        await _db.SaveChangesAsync();

        var line = await _db.BookingServices
            .Include(x => x.Service)
            .Include(x => x.Guest)
            .FirstAsync(x => x.BookingServiceId == link.BookingServiceId);

        return Ok(BookingMappings.ToBookingServiceLineDto(line));
    }

    [HttpDelete("booking-link/{bookingServiceId:int}")]
    public async Task<IActionResult> RemoveFromBooking(int bookingServiceId)
    {
        var line = await _db.BookingServices
            .Include(x => x.Booking)
            .FirstOrDefaultAsync(x => x.BookingServiceId == bookingServiceId);
        if (line is null) return NotFound("Позиция услуги не найдена.");

        var booking = line.Booking;
        if (booking is null) return NotFound("Бронирование не найдено.");

        if (booking.Status == "cancelled")
        {
            return BadRequest("Нельзя изменять услуги отменённой брони.");
        }

        booking.TotalPrice -= line.TotalCost;
        if (booking.TotalPrice < 0) booking.TotalPrice = 0;

        _db.BookingServices.Remove(line);
        await _db.SaveChangesAsync();
        return Ok("Позиция услуги удалена.");
    }
}

using Hotel.Data;
using Hotel.Domain.Entities;
using Hotel.Domain.ValueObjects;
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
        return Ok(data);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Service service)
    {
        _db.Services.Add(service);
        await _db.SaveChangesAsync();
        return Ok(service);
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
        return Ok(entity);
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
        var booking = await _db.Bookings.FirstOrDefaultAsync(x => x.BookingId == request.BookingId);
        if (booking is null) return NotFound("Бронирование не найдено.");

        var service = await _db.Services.FirstOrDefaultAsync(x => x.ServiceId == request.ServiceId);
        if (service is null) return NotFound("Услуга не найдена.");

        var totalCost = service.Price * request.Quantity;
        var link = new BookingService
        {
            BookingId = request.BookingId,
            ServiceId = request.ServiceId,
            Quantity = request.Quantity,
            TotalCost = totalCost
        };

        _db.BookingServices.Add(link);
        booking.TotalPrice += totalCost;

        var order = await _db.Orders.FirstOrDefaultAsync(x => x.OrderId == booking.OrderId);
        if (order is not null)
        {
            order.TotalAmount += totalCost;
        }

        await _db.SaveChangesAsync();
        return Ok(link);
    }
}

using Hotel.Data;
using Hotel.Domain.Entities;
using Hotel.Domain.ValueObjects;
using Hotel.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hotel.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public PaymentsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status,
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate)
    {
        var query = _db.Payments
            .Include(x => x.Booking!)
            .ThenInclude(x => x.Guest!)
            .ThenInclude(x => x.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(x => x.Status == status);
        }

        if (fromDate.HasValue)
        {
            var from = fromDate.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            query = query.Where(x => x.PaymentDatetime >= from);
        }

        if (toDate.HasValue)
        {
            var to = toDate.Value.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
            query = query.Where(x => x.PaymentDatetime <= to);
        }

        var data = await query
            .OrderByDescending(x => x.PaymentDatetime)
            .ToListAsync();

        return Ok(data.Select(BookingMappings.ToPaymentAdminDto).ToList());
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePaymentRequest request)
    {
        var booking = await _db.Bookings.FirstOrDefaultAsync(x => x.BookingId == request.BookingId);
        if (booking is null) return NotFound("Бронирование не найдено.");

        if (booking.Status == "cancelled")
        {
            return BadRequest("Нельзя оплатить отменённую бронь.");
        }

        var already = await _db.Payments.AnyAsync(x => x.BookingId == request.BookingId);
        if (already) return Conflict("Платеж по этой брони уже создан.");

        var payment = new Payment
        {
            BookingId = request.BookingId,
            Amount = booking.TotalPrice,
            PaymentMethod = request.PaymentMethod,
            TransactionId = Guid.NewGuid().ToString("N"),
            Status = "created"
        };

        _db.Payments.Add(payment);
        await _db.SaveChangesAsync();
        return Ok(BookingMappings.ToPaymentDto(payment));
    }

    [HttpPatch("{paymentId:int}/confirm")]
    public async Task<IActionResult> Confirm(int paymentId)
    {
        var payment = await _db.Payments
            .Include(x => x.Booking)
            .FirstOrDefaultAsync(x => x.PaymentId == paymentId);
        if (payment is null) return NotFound("Платеж не найден.");

        if (payment.Booking?.Status == "cancelled")
        {
            return BadRequest("Бронь отменена — подтверждение оплаты невозможно.");
        }

        payment.Status = "confirmed";
        payment.Amount = payment.Booking?.TotalPrice ?? payment.Amount;

        await _db.SaveChangesAsync();
        return Ok("Платеж подтвержден.");
    }

    [HttpPatch("{paymentId:int}/reject")]
    public async Task<IActionResult> Reject(int paymentId)
    {
        var payment = await _db.Payments.FirstOrDefaultAsync(x => x.PaymentId == paymentId);
        if (payment is null) return NotFound("Платеж не найден.");

        if (payment.Status == "confirmed")
        {
            return Conflict("Нельзя отклонить уже подтверждённый платёж.");
        }

        payment.Status = "cancelled";
        await _db.SaveChangesAsync();
        return Ok("Платеж отклонён.");
    }
}

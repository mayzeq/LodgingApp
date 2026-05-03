using Hotel.Data;
using Hotel.Domain.Entities;
using Hotel.Domain.ValueObjects;
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
    public async Task<IActionResult> GetAll()
    {
        var data = await _db.Payments
            .Include(x => x.Order)
            .ThenInclude(x => x!.User)
            .OrderByDescending(x => x.PaymentDatetime)
            .ToListAsync();
        return Ok(data);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePaymentRequest request)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(x => x.OrderId == request.OrderId);
        if (order is null) return NotFound("Заказ не найден.");

        var already = await _db.Payments.AnyAsync(x => x.OrderId == request.OrderId);
        if (already) return Conflict("Платеж по этому заказу уже создан.");

        var payment = new Payment
        {
            OrderId = request.OrderId,
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod,
            TransactionId = Guid.NewGuid().ToString("N"),
            Status = "created"
        };

        _db.Payments.Add(payment);
        await _db.SaveChangesAsync();
        return Ok(payment);
    }

    [HttpPatch("{paymentId:int}/confirm")]
    public async Task<IActionResult> Confirm(int paymentId)
    {
        var payment = await _db.Payments.FirstOrDefaultAsync(x => x.PaymentId == paymentId);
        if (payment is null) return NotFound("Платеж не найден.");

        payment.Status = "confirmed";
        var order = await _db.Orders.FirstOrDefaultAsync(x => x.OrderId == payment.OrderId);
        if (order is not null)
        {
            order.Status = "paid";
        }

        await _db.SaveChangesAsync();
        return Ok("Платеж подтвержден.");
    }
}

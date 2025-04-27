using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using LodgingApp.Domain.Services;
using LodgingApp.Domain.DTOs;

namespace LodgingApp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingController : ControllerBase
    {
        private readonly BookingService _service;
        public BookingController(BookingService service) => _service = service;

        [HttpPost]
        public async Task<IActionResult> Create(CreateBookingDto dto)
        {
            var booking = await _service.CreateAsync(dto.UserId, dto.LodgingId, dto.StartDate, dto.EndDate);
            return Ok(booking);
        }

        [HttpPatch("{id}/confirm")]
        public async Task<IActionResult> Confirm(int id)
        {
            await _service.ConfirmAsync(id);
            return NoContent();
        }

        [HttpPatch("{id}/cancel")]
        public async Task<IActionResult> Cancel(int id)
        {
            await _service.CancelAsync(id);
            return NoContent();
        }
    }
}

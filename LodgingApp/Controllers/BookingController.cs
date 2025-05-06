using Microsoft.AspNetCore.Mvc;
using LodgingApp.Domain.ValueObjects;
using LodgingApp.Domain.Services.Contracts;

namespace LodgingApp.API.Controllers
{
    /// <summary>
    /// Контроллер для управления бронированиями
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class BookingController : ControllerBase
    {
        private readonly IBookingService _service;

        /// <summary>
        /// Инициализирует новый экземпляр класса BookingController
        /// </summary>
        /// <param name="service">Сервис бронирований</param>
        public BookingController(IBookingService service) => _service = service;

        /// <summary>
        /// Создает новое бронирование
        /// </summary>
        /// <param name="dto">Данные для создания бронирования</param>
        /// <returns>Созданное бронирование</returns>
        /// <response code="200">Бронирование успешно создано</response>
        /// <response code="400">Некорректные данные</response>
        [HttpPost]
        public async Task<IActionResult> Create([FromQuery] BookingRequest dto)
        {
            var booking = await _service.CreateAsync(dto.UserId, dto.LodgingId, dto.StartDate, dto.EndDate);
            return Ok(booking);
        }

        /// <summary>
        /// Подтверждает бронирование
        /// </summary>
        /// <param name="id">Идентификатор бронирования</param>
        /// <returns>Нет содержимого</returns>
        /// <response code="204">Бронирование успешно подтверждено</response>
        /// <response code="404">Бронирование не найдено</response>
        [HttpPatch("{id:int}/confirm")]
        public async Task<IActionResult> Confirm(int id)
        {
            await _service.ConfirmAsync(id);
            return NoContent();
        }

        /// <summary>
        /// Отменяет бронирование
        /// </summary>
        /// <param name="id">Идентификатор бронирования</param>
        /// <returns>Нет содержимого</returns>
        /// <response code="204">Бронирование успешно отменено</response>
        /// <response code="404">Бронирование не найдено</response>
        [HttpPatch("{id:int}/cancel")]
        public async Task<IActionResult> Cancel(int id)
        {
            await _service.CancelAsync(id);
            return NoContent();
        }
    }
}

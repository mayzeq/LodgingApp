using Microsoft.AspNetCore.Mvc;
using AutoMapper;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.ValueObjects;
using LodgingApp.Domain.Services.Contracts;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace LodgingApp.Controllers
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
        /// <param name="dto">Объект запроса на бронирование</param>
        /// <returns>Результат действия с данными созданного бронирования</returns>
        /// <response code="200">Бронирование успешно создано</response>
        /// <response code="400">Ошибочные данные в запросе</response>
        /// <response code="401">Пользователь не авторизован</response>
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Create([FromQuery] BookingRequest dto)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "UserId");
            if (userIdClaim == null) return Unauthorized("UserId не найден в токене");
            var userId = int.Parse(userIdClaim.Value);

            var booking = await _service.CreateAsync(userId, dto.LodgingId, dto.StartDate, dto.EndDate);
            return Ok(booking);
        }

        /// <summary>
        /// Отменяет бронирование пользователя
        /// </summary>
        /// <param name="bookingId">Идентификатор бронирования</param>
        /// <returns>Результат действия</returns>
        /// <response code="200">Бронирование успешно отменено</response>
        /// <response code="403">Недостаточно прав для отмены</response>
        /// <response code="404">Бронирование не найдено</response>
        [Authorize]
        [HttpPatch("{bookingId}/cancel")]
        public async Task<IActionResult> Cancel(int bookingId)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "UserId");
            if (userIdClaim == null)
                return Unauthorized("Идентификатор пользователя не найден в токене");

            int userId = int.Parse(userIdClaim.Value);

            try
            {
                await _service.CancelAsync(bookingId, userId);
                return Ok("Бронирование успешно отменено");
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("Недостаточно прав для отмены данного бронирования");
            }
            catch (Exception ex)
            {
                return NotFound($"Ошибка при отмене бронирования: {ex.Message}");
            }
        }

        /// <summary>
        /// Получает все бронирования указанного пользователя
        /// </summary>
        /// <param name="userId">Идентификатор пользователя</param>
        /// <returns>Список бронирований</returns>
        /// <response code="200">Список успешно получен</response>
        [HttpGet("by-user/{userId}")]
        public async Task<IActionResult> GetByUser(int userId)
        {
            var bookings = await _service.GetByUserAsync(userId);
            return Ok(bookings);
        }

        /// <summary>
        /// Получает конкретное бронирование по идентификатору
        /// </summary>
        /// <param name="bookingId">Идентификатор бронирования</param>
        /// <returns>Бронирование</returns>
        /// <response code="200">Бронирование найдено</response>
        /// <response code="404">Бронирование не найдено</response>
        [HttpGet("{bookingId}")]
        public async Task<IActionResult> GetById(int bookingId)
        {
            try
            {
                var booking = await _service.GetBookingByIdAsync(bookingId);
                if (booking == null)
                    return NotFound($"Объявление с идентификатором {bookingId} не найдено");

                return Ok(booking);
            }
            catch (Exception ex)
            {
                return BadRequest($"Ошибка при получении объявления: {ex.Message}");
            }
        }
    }
}

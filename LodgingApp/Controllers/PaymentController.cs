using Microsoft.AspNetCore.Mvc;
using AutoMapper;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.ValueObjects;
using LodgingApp.Domain.Services.Contracts;
using Microsoft.AspNetCore.Authorization;

namespace LodgingApp.Controllers
{
    /// <summary>
    /// Контроллер для управления платежами
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _service;
        private readonly IMapper _mapper;

        /// <summary>
        /// Инициализирует новый экземпляр класса PaymentController
        /// </summary>
        /// <param name="service">Сервис управления платежами</param>
        /// <param name="mapper">Объект для маппинга DTO</param>
        public PaymentController(IPaymentService service, IMapper mapper)
        {
            _service = service;
            _mapper = mapper;
        }

        /// <summary>
        /// Создает новый платёж
        /// </summary>
        /// <param name="dto">Объект запроса создания платежа</param>
        /// <returns>Результат с данными платежа</returns>
        /// <response code="200">Платёж успешно создан</response>
        /// <response code="400">Ошибка в запросе</response>
        /// <response code="401">Пользователь не авторизован</response>
        [HttpPost]
        public async Task<IActionResult> Create([FromQuery] PaymentCreation dto)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "UserId");
            if (userIdClaim == null) return Unauthorized("UserId не найден в токене");
            var userId = int.Parse(userIdClaim.Value);

            var payment = _mapper.Map<Payment>(dto);
            var result = await _service.CreateAsync(userId, dto.BookingId, dto.Amount);
            return Ok(result);
        }

        /// <summary>
        /// Подтверждает платёж
        /// </summary>
        /// <param name="paymentId">Идентификатор платежа</param>
        /// <returns>Результат действия</returns>
        /// <response code="200">Платёж подтверждён</response>
        /// <response code="404">Платёж не найден</response>
        [HttpPatch("{paymentId}/confirm")]
        public async Task<IActionResult> Confirm(int paymentId)
        {
            await _service.ConfirmAsync(paymentId);
            return Ok("Платеж успешно подтвержден");
        }
    }
}
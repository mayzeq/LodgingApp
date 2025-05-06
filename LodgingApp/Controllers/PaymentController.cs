using Microsoft.AspNetCore.Mvc;
using AutoMapper;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.ValueObjects;
using LodgingApp.Domain.Services.Contracts;

namespace LodgingApp.API.Controllers
{
    /// <summary>
    /// Контроллер для управления платежами
    /// </summary>
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
        /// Создает новый платеж
        /// </summary>
        /// <param name="dto">Данные для создания платежа</param>
        /// <returns>Созданный платеж</returns>
        /// <response code="200">Платеж успешно создан</response>
        /// <response code="400">Некорректные данные</response>
        [HttpPost]
        public async Task<IActionResult> Create([FromQuery] PaymentCreation dto)
        {
            var payment = _mapper.Map<Payment>(dto);
            var result = await _service.CreateAsync(payment);
            return Ok(result);
        }

        /// <summary>
        /// Подтверждает платеж
        /// </summary>
        /// <param name="id">Идентификатор платежа</param>
        /// <returns>Нет содержимого</returns>
        /// <response code="204">Платеж успешно подтвержден</response>
        /// <response code="404">Платеж не найден</response>
        [HttpPatch("{id}/confirm")]
        public async Task<IActionResult> Confirm(int id)
        {
            await _service.ConfirmAsync(id);
            return NoContent();
        }
    }
}
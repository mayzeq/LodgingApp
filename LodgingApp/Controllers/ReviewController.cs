using Microsoft.AspNetCore.Mvc;
using AutoMapper;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.ValueObjects;
using LodgingApp.Domain.Services.Contracts;
using Microsoft.AspNetCore.Authorization;

namespace LodgingApp.Controllers
{
    /// <summary>
    /// Контроллер для управления отзывами
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewController : ControllerBase
    {
        private readonly IReviewService _service;
        private readonly IMapper _mapper;

        /// <summary>
        /// Инициализирует новый экземпляр класса ReviewController
        /// </summary>
        /// <param name="service">Сервис управления отзывами</param>
        /// <param name="mapper">Объект для маппинга DTO</param>
        public ReviewController(IReviewService service, IMapper mapper)
        {
            _service = service;
            _mapper = mapper;
        }

        /// <summary>
        /// Создает новый отзыв на жильё
        /// </summary>
        /// <param name="dto">Объект отзыва</param>
        /// <returns>Созданный отзыв</returns>
        /// <response code="200">Отзыв успешно создан</response>
        /// <response code="400">Ошибочные данные или отсутствие бронирования</response>
        /// <response code="401">Пользователь не авторизован</response>
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Create([FromQuery] ReviewCreation dto)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "UserId");
            if (userIdClaim == null) return Unauthorized("UserId не найден в токене");
            var userId = int.Parse(userIdClaim.Value);

            var review = _mapper.Map<Review>(dto);
            var result = await _service.CreateAsync(userId, dto.LodgingId, dto.Rating, dto.Comment);
            return Ok(result);
        }

        /// <summary>
        /// Получает список отзывов для указанного жилья
        /// </summary>
        /// <param name="lodgingId">Идентификатор жилья</param>
        /// <returns>Список отзывов</returns>
        /// <response code="200">Отзывы успешно получены</response>
        /// <response code="404">Жильё не найдено</response>
        [HttpGet("by-lodging/{lodgingId}")]
        public async Task<IActionResult> GetByLodging(int lodgingId)
        {
            var reviews = await _service.GetByLodgingAsync(lodgingId);
            return Ok(reviews);
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using AutoMapper;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.ValueObjects;
using LodgingApp.Domain.Services.Contracts;

namespace LodgingApp.API.Controllers
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
        /// Создает новый отзыв
        /// </summary>
        /// <param name="dto">Данные для создания отзыва</param>
        /// <returns>Созданный отзыв</returns>
        /// <response code="200">Отзыв успешно создан</response>
        /// <response code="400">Некорректные данные</response>
        [HttpPost]
        public async Task<IActionResult> Create([FromQuery] ReviewCreation dto)
        {
            var review = _mapper.Map<Review>(dto);
            var result = await _service.CreateAsync(review);
            return Ok(result);
        }

        /// <summary>
        /// Получает отзывы по конкретному жилью
        /// </summary>
        /// <param name="lodgingId">Идентификатор жилья</param>
        /// <returns>Список отзывов</returns>
        /// <response code="200">Список успешно получен</response>
        /// <response code="404">Жилье не найдено</response>
        [HttpGet("by-lodging/{lodgingId}")]
        public async Task<IActionResult> GetByLodging(int lodgingId)
        {
            var reviews = await _service.GetByLodgingAsync(lodgingId);
            return Ok(reviews);
        }
    }
}

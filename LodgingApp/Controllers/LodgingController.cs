using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AutoMapper;
using LodgingApp.Domain.ValueObjects;
using LodgingApp.Domain.Services.Contracts;
using System.Security.Claims;

namespace LodgingApp.Controllers
{
    /// <summary>
    /// Контроллер для управления жильем
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class LodgingController : ControllerBase
    {
        private readonly ILodgingService _service;
        private readonly IMapper _mapper;

        /// <summary>
        /// Инициализирует новый экземпляр класса LodgingController
        /// </summary>
        /// <param name="service">Сервис управления жильем</param>
        /// <param name="mapper">Объект для маппинга DTO</param>
        public LodgingController(ILodgingService service, IMapper mapper)
        {
            _service = service ?? throw new ArgumentNullException(nameof(service));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        }

        /// <summary>
        /// Создает новое объявление о жилье
        /// </summary>
        /// <param name="dto">Данные для создания объявления</param>
        /// <returns>Созданное объявление</returns>
        /// <response code="200">Объявление успешно создано</response>
        /// <response code="400">Некорректные данные</response>
        /// <response code="401">Требуется авторизация</response>
        [Authorize]
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromQuery] LodgingCreation dto)
        {
            if (dto == null)
                return BadRequest("Данные для создания объявления не указаны");

            try
            {
                var lodging = _mapper.Map<Domain.Entities.Lodging>(dto);

                var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "UserId");
                if (userIdClaim == null) return Unauthorized("UserId не найден в токене");
                var userId = int.Parse(userIdClaim.Value);

                var result = await _service.CreateAsync(lodging, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Ошибка при создании объявления: {ex.Message}");
            }
        }

        /// <summary>
        /// Удаляет объявление о жилье
        /// </summary>
        /// <param name="lodginhId">Идентификатор жилья</param>
        /// <returns>Нет содержимого</returns>
        /// <response code="200">Объявление успешно удалено</response>
        /// <response code="401">Требуется авторизация</response>
        /// <response code="404">Объявление не найдено</response>
        [Authorize]
        [HttpDelete("{lodginhId}")]
        public async Task<IActionResult> Delete(int lodginhId)
        {
            try
            {
                await _service.DeleteAsync(lodginhId);
                return Ok("Объявление успешно удалено");
            }
            catch (Exception ex)
            {
                return BadRequest($"Ошибка при удалении объявления: {ex.Message}");
            }
        }

        /// <summary>
        /// Получает список всех объявлений
        /// </summary>
        /// <returns>Список объявлений</returns>
        /// <response code="200">Список успешно получен</response>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var list = await _service.GetAllAsync();
                return Ok(list);
            }
            catch (Exception ex)
            {
                return BadRequest($"Ошибка при получении списка объявлений: {ex.Message}");
            }
        }

        /// <summary>
        /// Получает объявление по идентификатору
        /// </summary>
        /// <param name="lodginhId">Идентификатор жилья</param>
        /// <returns>Объявление</returns>
        /// <response code="200">Объявление успешно получено</response>
        /// <response code="404">Объявление не найдено</response>
        [HttpGet("{lodginhId}")]
        public async Task<IActionResult> GetById(int lodginhId)
        {
            try
            {
                var lodging = await _service.GetLodgingByIdAsync(lodginhId);
                if (lodging == null)
                    return NotFound($"Объявление с идентификатором {lodginhId} не найдено");

                return Ok(lodging);
            }
            catch (Exception ex)
            {
                return BadRequest($"Ошибка при получении объявления: {ex.Message}");
            }
        }
    }
}
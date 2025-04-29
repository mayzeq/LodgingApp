using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using AutoMapper;
using LodgingApp.Domain.DTOs;
using LodgingApp.Application.Services;

namespace LodgingApp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LodgingController : ControllerBase
    {
        private readonly LodgingService _service;
        private readonly IMapper _mapper;

        public LodgingController(LodgingService service, IMapper mapper)
        {
            _service = service;
            _mapper = mapper;
        }

        /// <summary>
        /// Создать новое объявление (только для авторизованных админов)
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create(CreateLodgingDto dto)
        {
            var lodging = _mapper.Map<Domain.Entities.Lodging>(dto);
            var result = await _service.CreateAsync(lodging);
            return Ok(result);
        }

        /// <summary>
        /// Получить все объявления
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var list = await _service.GetAllAsync();
            return Ok(list);
        }
    }
}
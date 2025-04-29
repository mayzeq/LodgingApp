using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using AutoMapper;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.DTOs;
using LodgingApp.Application.Services;

namespace LodgingApp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewController : ControllerBase
    {
        private readonly ReviewService _service;
        private readonly IMapper _mapper;

        public ReviewController(ReviewService service, IMapper mapper)
        {
            _service = service;
            _mapper = mapper;
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateReviewDto dto)
        {
            var review = _mapper.Map<Review>(dto);
            var result = await _service.CreateAsync(review);
            return Ok(result);
        }

        [HttpGet("by-lodging/{lodgingId}")]
        public async Task<IActionResult> GetByLodging(int lodgingId)
        {
            var reviews = await _service.GetByLodgingAsync(lodgingId);
            return Ok(reviews);
        }
    }
}

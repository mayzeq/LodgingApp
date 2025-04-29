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
    public class PaymentController : ControllerBase
    {
        private readonly PaymentService _service;
        private readonly IMapper _mapper;

        public PaymentController(PaymentService service, IMapper mapper)
        {
            _service = service;
            _mapper = mapper;
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreatePaymentDto dto)
        {
            var payment = _mapper.Map<Payment>(dto);
            var result = await _service.CreateAsync(payment);
            return Ok(result);
        }

        [HttpPatch("{id}/confirm")]
        public async Task<IActionResult> Confirm(int id)
        {
            await _service.ConfirmAsync(id);
            return NoContent();
        }
    }
}
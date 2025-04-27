using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using LodgingApp.Application.Services;
using LodgingApp.Domain.DTOs;

namespace LodgingApp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _auth;
        public AuthController(AuthService auth) => _auth = auth;

        /// <summary>
        /// Регистрация нового пользователя
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            var user = await _auth.RegisterAsync(dto);
            return Ok(new { user.UserId, user.Username, user.Email });
        }

        /// <summary>
        /// Логин пользователя и получение JWT
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var token = await _auth.LoginAsync(dto);
            return Ok(new { token });
        }
    }
}
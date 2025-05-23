using Microsoft.AspNetCore.Mvc;
using LodgingApp.Domain.ValueObjects;
using LodgingApp.Domain.Services.Contracts;

namespace LodgingApp.Controllers
{
    /// <summary>
    /// Контроллер для управления аутентификацией и авторизацией
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _auth;

        /// <summary>
        /// Инициализирует новый экземпляр класса AuthController
        /// </summary>
        /// <param name="auth">Сервис аутентификации</param>
        public AuthController(IAuthService auth) => _auth = auth;

        /// <summary>
        /// Регистрирует нового пользователя
        /// </summary>
        /// <param name="dto">Данные для регистрации</param>
        /// <returns>Информация о зарегистрированном пользователе</returns>
        /// <response code="200">Пользователь успешно зарегистрирован</response>
        /// <response code="400">Некорректные данные</response>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromQuery] RegistrationRequest dto)
        {
            var user = await _auth.RegisterAsync(dto);
            return Ok(new { user.UserId, user.Username, user.Email, user.PhoneNumber});
        }

        /// <summary>
        /// Выполняет вход пользователя и получает JWT токен
        /// </summary>
        /// <param name="dto">Данные для входа</param>
        /// <returns>JWT токен для авторизации</returns>
        /// <response code="200">Успешный вход</response>
        /// <response code="401">Неверные учетные данные</response>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromQuery] LoginRequest dto)
        {
            var token = await _auth.LoginAsync(dto);
            return Ok(new { token });
        }
    }
}
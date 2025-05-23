using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.ValueObjects;
using LodgingApp.Domain.Services.Contracts;
using LodgingApp.Domain.Repositories;

namespace LodgingApp.Domain.Services.UseCases
{
    /// <summary>
    /// Сервис для управления аутентификацией и авторизацией пользователей
    /// </summary>
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepo;
        private readonly IConfiguration _config;

        /// <summary>
        /// Инициализирует новый экземпляр класса AuthService
        /// </summary>
        /// <param name="userRepo">Репозиторий пользователей</param>
        /// <param name="config">Конфигурация приложения</param>
        public AuthService(IUserRepository userRepo, IConfiguration config)
        {
            _userRepo = userRepo;
            _config = config;
        }

        /// <summary>
        /// Регистрирует нового пользователя
        /// </summary>
        /// <param name="dto">Данные для регистрации</param>
        /// <returns>Зарегистрированный пользователь</returns>
        /// <exception cref="InvalidOperationException">Выбрасывается, если имя пользователя уже существует</exception>
        public async Task<User> RegisterAsync(RegistrationRequest dto)
        {
            var existing = await _userRepo.GetAllAsync();
            if (existing.Any(u => u.Username == dto.Username))
                throw new InvalidOperationException("Username already exists");

            var user = new User
            {
                Username = dto.Username,
                Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber
            };
            await _userRepo.AddAsync(user);
            await _userRepo.SaveChangesAsync();
            return user;
        }

        /// <summary>
        /// Выполняет вход пользователя и генерирует JWT токен
        /// </summary>
        /// <param name="dto">Данные для входа</param>
        /// <returns>JWT токен для авторизации</returns>
        /// <exception cref="InvalidOperationException">Выбрасывается при неверных учетных данных</exception>
        public async Task<string> LoginAsync(LoginRequest dto)
        {
            var user = (await _userRepo.GetAllAsync()).FirstOrDefault(u => u.Username == dto.Username);
            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Password))
                throw new InvalidOperationException("Invalid credentials");

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_config["Jwt:Key"]);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim("UserId", user.UserId.ToString()),
                    new Claim("Username", user.Username)
                }),
                Expires = DateTime.UtcNow.AddHours(6),
                Issuer = _config["Jwt:Issuer"],
                Audience = _config["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}

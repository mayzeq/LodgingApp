using LodgingApp.Domain.Entities;
using LodgingApp.Domain.ValueObjects;

namespace LodgingApp.Domain.Services.Contracts
{
    /// <summary>
    /// Интерфейс для сервиса аутентификации и авторизации
    /// </summary>
    public interface IAuthService
    {
        /// <summary>
        /// Регистрирует нового пользователя
        /// </summary>
        /// <param name="dto">Данные для регистрации</param>
        /// <returns>Зарегистрированный пользователь</returns>
        Task<User> RegisterAsync(RegistrationRequest dto);

        /// <summary>
        /// Выполняет вход пользователя и генерирует JWT токен
        /// </summary>
        /// <param name="dto">Данные для входа</param>
        /// <returns>JWT токен для авторизации</returns>
        Task<string> LoginAsync(LoginRequest dto);
    }
} 
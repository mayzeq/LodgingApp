using LodgingApp.Domain.Entities;

namespace LodgingApp.Domain.Services.Contracts
{
    /// <summary>
    /// Интерфейс для сервиса управления жильем
    /// </summary>
    public interface ILodgingService
    {
        /// <summary>
        /// Создает новое объявление о жилье
        /// </summary>
        /// <param name="lodging">Данные жилья</param>
        /// <returns>Созданное жилье</returns>
        Task<Lodging> CreateAsync(Lodging lodging);

        /// <summary>
        /// Удаляет жилье
        /// </summary>
        /// <param name="id">Идентификатор жилья</param>
        Task DeleteAsync(int id);

        /// <summary>
        /// Получает список всего жилья
        /// </summary>
        /// <returns>Список жилья</returns>
        Task<IEnumerable<Lodging>> GetAllAsync();

        /// <summary>
        /// Получает жилье по идентификатору
        /// </summary>
        /// <param name="id">Идентификатор жилья</param>
        /// <returns>Жилье или null, если не найдено</returns>
        Task<Lodging> GetByIdAsync(int id);
    }
} 
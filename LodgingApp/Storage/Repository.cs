using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using static LodgingApp.Domain.Repositories.IRepository;

namespace LodgingApp.Data
{
    /// <summary>
    /// Универсальный репозиторий для сущностей.
    /// </summary>
    /// <typeparam name="T">Тип сущности</typeparam>

    public class Repository<T> : IRepository<T> where T : class
    {
        protected readonly AppDbContext _context;
        protected readonly DbSet<T> _dbSet;

        public Repository(AppDbContext context)
        {
            _context = context;
            _dbSet = context.Set<T>();
        }

        /// <summary>
        /// Возвращает все сущности типа T.
        /// </summary>
        public async Task<IEnumerable<T>> GetAllAsync() => await _dbSet.ToListAsync();

        /// <summary>
        /// Возвращает сущность по её идентификатору.
        /// </summary>
        /// <param name="id">Идентификатор сущности</param>
        public async Task<T> GetByIdAsync(int id) => await _dbSet.FindAsync(id);

        /// <summary>
        /// Добавляет новую сущность в контекст.
        /// </summary>
        /// <param name="entity">Добавляемая сущность</param>
        public async Task AddAsync(T entity) => await _dbSet.AddAsync(entity);

        /// <summary>
        /// Обновляет сущность.
        /// </summary>
        /// <param name="entity">Сущность для обновления</param>
        public void Update(T entity) => _dbSet.Update(entity);

        /// <summary>
        /// Удаляет сущность.
        /// </summary>
        /// <param name="entity">Сущность для удаления</param>
        public void Delete(T entity) => _dbSet.Remove(entity);

        /// <summary>
        /// Сохраняет все изменения в базе данных.
        /// </summary>
        /// <returns>Количество затронутых строк</returns>
        public async Task<int> SaveChangesAsync() => await _context.SaveChangesAsync();
    }
}
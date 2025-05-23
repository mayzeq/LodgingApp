using LodgingApp.Domain.Entities;
using static LodgingApp.Domain.Repositories.IRepository;

namespace LodgingApp.Domain.Repositories
{
    public interface IAdminRepository : IRepository<Admin>
    {
        Task<Admin?> GetByUserIdAsync(int userId);
    }
}
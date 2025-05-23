using LodgingApp.Domain.Entities;
using static LodgingApp.Domain.Repositories.IRepository;

namespace LodgingApp.Domain.Repositories
{
    public interface ILodgingRepository : IRepository<Lodging>
    {
        Task<Lodging?> GetLodgingByIdWithDetailsAsync(int lodgingId);
    }

}

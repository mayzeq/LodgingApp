using LodgingApp.Data;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Interfaces;


namespace LodgingApp.Infrastructure.Repositories
{
    public class LodgingRepository : Repository<Lodging>, ILodgingRepository
    {
        public LodgingRepository(AppDbContext ctx) : base(ctx) { }
    }
}

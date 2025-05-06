using LodgingApp.Data;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Services.Contracts;


namespace LodgingApp.Domain.Repositories
{
    public class LodgingRepository : Repository<Lodging>, ILodgingRepository
    {
        public LodgingRepository(AppDbContext ctx) : base(ctx) { }
    }
}

using LodgingApp.Data;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Repositories;
using Microsoft.EntityFrameworkCore;


namespace LodgingApp.Storage
{
    public class LodgingRepository : Repository<Lodging>, ILodgingRepository
    {
        public LodgingRepository(AppDbContext ctx) : base(ctx) { }

        public async Task<Lodging> GetLodgingByIdWithDetailsAsync(int lodgingId)
        {
            return await _context.Lodgings
                .Include(l => l.Reviews)
                .Include(l => l.Bookings)
                    .ThenInclude(b => b.Payment)
                .FirstOrDefaultAsync(l => l.LodgingId == lodgingId);
        }

    }
}

using LodgingApp.Data;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Repositories;

namespace LodgingApp.Storage
{
    public class ReviewRepository : Repository<Review>, IReviewRepository
    {
        public ReviewRepository(AppDbContext ctx) : base(ctx) { }
    }
}

using LodgingApp.Data;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Interfaces;


namespace LodgingApp.Infrastructure.Repositories
{
    public class ReviewRepository : Repository<Review>, IReviewRepository
    {
        public ReviewRepository(AppDbContext ctx) : base(ctx) { }
    }
}

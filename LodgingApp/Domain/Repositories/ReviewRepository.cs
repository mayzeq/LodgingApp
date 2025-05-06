using LodgingApp.Data;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Services.Contracts;


namespace LodgingApp.Domain.Repositories
{
    public class ReviewRepository : Repository<Review>, IReviewRepository
    {
        public ReviewRepository(AppDbContext ctx) : base(ctx) { }
    }
}

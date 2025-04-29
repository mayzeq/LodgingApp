using System.Threading.Tasks;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Interfaces;

namespace LodgingApp.Application.Services
{
    public class ReviewService
    {
        private readonly IReviewRepository _reviewRepo;
        public ReviewService(IReviewRepository reviewRepo)
        {
            _reviewRepo = reviewRepo;
        }

        public async Task<Review> CreateAsync(Review review)
        {
            review.Date = DateTime.UtcNow;
            await _reviewRepo.AddAsync(review);
            await _reviewRepo.SaveChangesAsync();
            return review;
        }

        public async Task<IEnumerable<Review>> GetByLodgingAsync(int lodgingId)
        {
            var all = await _reviewRepo.GetAllAsync();
            return all.Where(r => r.LodgingId == lodgingId);
        }
    }
}

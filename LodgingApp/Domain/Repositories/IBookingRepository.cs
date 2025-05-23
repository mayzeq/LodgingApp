using LodgingApp.Domain.Entities;
using static LodgingApp.Domain.Repositories.IRepository;

namespace LodgingApp.Domain.Repositories
{
    public interface IBookingRepository : IRepository<Booking> 
    {
        Task<Booking?> GetBookingByIdWithDetailsAsync(int bookingId);
    }
}

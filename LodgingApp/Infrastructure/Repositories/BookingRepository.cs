using LodgingApp.Data;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Interfaces;


namespace LodgingApp.Infrastructure.Repositories
{
    public class BookingRepository : Repository<Booking>, IBookingRepository
    {
        public BookingRepository(AppDbContext ctx) : base(ctx) { }
    }
}

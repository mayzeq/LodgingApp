using LodgingApp.Data;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Services.Contracts;


namespace LodgingApp.Domain.Repositories
{
    public class BookingRepository : Repository<Booking>, IBookingRepository
    {
        public BookingRepository(AppDbContext ctx) : base(ctx) { }
    }
}

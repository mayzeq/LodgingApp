using LodgingApp.Data;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Repositories;
using Microsoft.EntityFrameworkCore;


namespace LodgingApp.Storage
{
    public class BookingRepository : Repository<Booking>, IBookingRepository
    {
        public BookingRepository(AppDbContext ctx) : base(ctx) { }

        public async Task<Booking> GetBookingByIdWithDetailsAsync(int bookingId)
        {
            return await _context.Bookings
                .Include(l => l.Payment)
                .FirstOrDefaultAsync(l => l.BookingId == bookingId);
        }

    }
}

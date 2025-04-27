using LodgingApp.Domain.Entities;
using static LodgingApp.Domain.Interfaces.IRepository;

namespace LodgingApp.Domain.Interfaces
{
    public interface IBookingRepository : IRepository<Booking> { }
}

using LodgingApp.Domain.Entities;
using static LodgingApp.Domain.IRepository;

namespace LodgingApp.Domain.Services.Contracts
{
    public interface IBookingRepository : IRepository<Booking> { }
}

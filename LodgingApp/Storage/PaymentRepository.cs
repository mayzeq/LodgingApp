using LodgingApp.Data;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Repositories;

namespace LodgingApp.Storage
{
    public class PaymentRepository : Repository<Payment>, IPaymentRepository
    {
        public PaymentRepository(AppDbContext ctx) : base(ctx) { }
    }
}

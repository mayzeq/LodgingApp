using LodgingApp.Data;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Interfaces;


namespace LodgingApp.Infrastructure.Repositories
{
    public class PaymentRepository : Repository<Payment>, IPaymentRepository
    {
        public PaymentRepository(AppDbContext ctx) : base(ctx) { }
    }
}

using LodgingApp.Data;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Services.Contracts;


namespace LodgingApp.Domain.Repositories
{
    public class PaymentRepository : Repository<Payment>, IPaymentRepository
    {
        public PaymentRepository(AppDbContext ctx) : base(ctx) { }
    }
}

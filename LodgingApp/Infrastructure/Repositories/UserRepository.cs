using LodgingApp.Data;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Interfaces;


namespace LodgingApp.Infrastructure.Repositories
{
    public class UserRepository : Repository<User>, IUserRepository
    {
        public UserRepository(AppDbContext ctx) : base(ctx) { }
    }
}

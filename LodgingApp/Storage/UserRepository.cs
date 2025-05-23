using LodgingApp.Data;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Repositories;

namespace LodgingApp.Storage
{
    public class UserRepository : Repository<User>, IUserRepository
    {
        public UserRepository(AppDbContext ctx) : base(ctx) { }
    }
}

using LodgingApp.Data;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Services.Contracts;


namespace LodgingApp.Domain.Repositories
{
    public class UserRepository : Repository<User>, IUserRepository
    {
        public UserRepository(AppDbContext ctx) : base(ctx) { }
    }
}

using System.Collections.Generic;
using System.Threading.Tasks;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Repositories;
using LodgingApp.Domain.Services.Contracts;

namespace LodgingApp.Domain.Services.UseCases
{
    public class LodgingService : ILodgingService
    {
        private readonly ILodgingRepository _repo;
        private readonly IUserRepository _userRepo;
        private readonly IAdminRepository _adminRepo;

        public LodgingService(ILodgingRepository repo, IUserRepository userRepo, IAdminRepository adminRepo)
        {
            _repo = repo;
            _userRepo = userRepo;
            _adminRepo = adminRepo;
        }

        public async Task<Lodging> CreateAsync(Lodging lodging, int userId)
        {
            // Проверка, есть ли пользователь
            var user = await _userRepo.GetByIdAsync(userId);
            if (user == null)
                throw new Exception("Пользователь не найден");

            // Проверка, является ли пользователь администратором
            var admin = await _adminRepo.GetByUserIdAsync(userId);
            if (admin == null)
            {
                admin = new Admin
                {
                    UserId = userId,
                    Type = "Owner",
                    User = user
                };
                await _adminRepo.AddAsync(admin);
                await _adminRepo.SaveChangesAsync();
            }

            // Установка администратора
            lodging.AdminId = admin.AdminId;
            lodging.Admin = admin;

            await _repo.AddAsync(lodging);
            await _repo.SaveChangesAsync();

            return lodging;
        }

        public async Task<IEnumerable<Lodging>> GetAllAsync() => await _repo.GetAllAsync();

        public async Task<Lodging> GetLodgingByIdAsync(int lodgingId)
        {
            var lodging = await _repo.GetLodgingByIdWithDetailsAsync(lodgingId);
            return lodging;
        }

        public async Task DeleteAsync(int id)
        {
            var lodging = await _repo.GetByIdAsync(id);
            if (lodging != null)
            {
                _repo.Delete(lodging);
                await _repo.SaveChangesAsync();
            }
        }
    }
}
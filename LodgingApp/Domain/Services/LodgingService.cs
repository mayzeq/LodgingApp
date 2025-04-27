using System.Collections.Generic;
using System.Threading.Tasks;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.Interfaces;

namespace LodgingApp.Domain.Services
{
    public class LodgingService
    {
        private readonly ILodgingRepository _repo;
        public LodgingService(ILodgingRepository repo) => _repo = repo;

        public async Task<Lodging> CreateAsync(Lodging lodging)
        {
            await _repo.AddAsync(lodging);
            await _repo.SaveChangesAsync();
            return lodging;
        }

        public async Task<IEnumerable<Lodging>> GetAllAsync() => await _repo.GetAllAsync();
    }
}
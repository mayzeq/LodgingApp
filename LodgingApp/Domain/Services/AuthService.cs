using System;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using BCrypt.Net;
using LodgingApp.Domain.Entities;
using LodgingApp.Domain.DTOs;
using LodgingApp.Domain.Interfaces;

namespace LodgingApp.Application.Services
{
    public class AuthService
    {
        private readonly IUserRepository _userRepo;
        private readonly IConfiguration _config;

        public AuthService(IUserRepository userRepo, IConfiguration config)
        {
            _userRepo = userRepo;
            _config = config;
        }

        public async Task<User> RegisterAsync(RegisterDto dto)
        {
            var existing = await _userRepo.GetAllAsync();
            if (existing.Any(u => u.Username == dto.Username))
                throw new InvalidOperationException("Username already exists");

            var user = new User
            {
                Username = dto.Username,
                Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber
            };
            await _userRepo.AddAsync(user);
            await _userRepo.SaveChangesAsync();
            return user;
        }

        public async Task<string> LoginAsync(LoginDto dto)
        {
            var user = (await _userRepo.GetAllAsync()).FirstOrDefault(u => u.Username == dto.Username);
            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Password))
                throw new InvalidOperationException("Invalid credentials");

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_config["Jwt:Key"]);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                    new Claim(ClaimTypes.Name, user.Username)
                }),
                Expires = DateTime.UtcNow.AddHours(6),
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}

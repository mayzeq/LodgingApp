using Hotel.Data;
using Hotel.Domain.Entities;
using Hotel.Domain.ValueObjects;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hotel.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterUserRequest request)
    {
        var loginExists = await _db.Users.AnyAsync(x => x.Login == request.Login);
        if (loginExists) return Conflict("Логин уже занят.");

        var emailExists = await _db.Users.AnyAsync(x => x.Email == request.Email);
        if (emailExists) return Conflict("Email уже занят.");

        var user = new User
        {
            Login = request.Login,
            Password = request.Password,
            Email = request.Email,
            Phone = request.Phone,
            Role = request.Role
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return Ok(user);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginUserRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Login == request.Login && x.Password == request.Password);
        if (user is null) return Unauthorized("Неверный логин или пароль.");

        return Ok(new { user.UserId, user.Login, user.Email, user.Role });
    }

    [HttpGet("{userId:int}")]
    public async Task<IActionResult> GetUserById(int userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.UserId == userId);
        if (user is null) return NotFound("Пользователь не найден.");
        return Ok(user);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _db.Users.OrderBy(x => x.UserId).ToListAsync();
        return Ok(users);
    }

    [HttpDelete("{userId:int}")]
    public async Task<IActionResult> Delete(int userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.UserId == userId);
        if (user is null) return NotFound("Пользователь не найден.");
        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return Ok("Пользователь удален.");
    }
}

using Hotel.Data;

using Hotel.Domain.Entities;

using Hotel.Domain.ValueObjects;

using Hotel.Dtos;

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

            Role = request.Role,

            IsActive = true

        };



        _db.Users.Add(user);

        await _db.SaveChangesAsync();

        return Ok(BookingMappings.ToUserSummaryDto(user));

    }



    [HttpPost("login")]

    public async Task<IActionResult> Login([FromBody] LoginUserRequest request)

    {

        var user = await _db.Users.FirstOrDefaultAsync(x => x.Login == request.Login && x.Password == request.Password);

        if (user is null) return Unauthorized("Неверный логин или пароль.");

        if (!user.IsActive) return Unauthorized("Учётная запись заблокирована.");



        return Ok(new { user.UserId, user.Login, user.Email, user.Phone, user.Role });

    }



    [HttpGet("{userId:int}")]

    public async Task<IActionResult> GetUserById(int userId)

    {

        var user = await _db.Users.FirstOrDefaultAsync(x => x.UserId == userId);

        if (user is null) return NotFound("Пользователь не найден.");

        return Ok(BookingMappings.ToUserSummaryDto(user));

    }



    [HttpGet]

    public async Task<IActionResult> GetAll()

    {

        var users = await _db.Users.OrderBy(x => x.UserId).ToListAsync();

        return Ok(users.Select(BookingMappings.ToUserSummaryDto).ToList());

    }



    [HttpPut("{userId:int}")]

    public async Task<IActionResult> Update(int userId, [FromBody] UpdateUserRequest request)

    {

        var user = await _db.Users.FirstOrDefaultAsync(x => x.UserId == userId);

        if (user is null) return NotFound("Пользователь не найден.");



        if (!string.IsNullOrWhiteSpace(request.Role))

        {

            var role = request.Role.Trim().ToLowerInvariant();

            if (role is not ("admin" or "guest"))

            {

                return BadRequest("Роль должна быть admin или guest.");

            }

            user.Role = role;

        }



        if (request.IsActive.HasValue)

        {

            user.IsActive = request.IsActive.Value;

        }



        if (!string.IsNullOrWhiteSpace(request.Email))

        {

            var emailTaken = await _db.Users.AnyAsync(x => x.Email == request.Email && x.UserId != userId);

            if (emailTaken) return Conflict("Email уже занят.");

            user.Email = request.Email.Trim();

        }



        if (request.Phone != null)

        {

            user.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();

        }



        await _db.SaveChangesAsync();

        return Ok(BookingMappings.ToUserSummaryDto(user));

    }



    [HttpPut("{userId:int}/account")]

    public async Task<IActionResult> UpdateAccount(int userId, [FromBody] UpdateAccountRequest request)

    {

        var user = await _db.Users.FirstOrDefaultAsync(x => x.UserId == userId);

        if (user is null) return NotFound("Пользователь не найден.");



        if (!string.IsNullOrWhiteSpace(request.NewPassword))

        {

            if (string.IsNullOrWhiteSpace(request.CurrentPassword))

                return BadRequest("Укажите текущий пароль для смены пароля.");

            if (user.Password != request.CurrentPassword)

                return Unauthorized("Неверный текущий пароль.");

            user.Password = request.NewPassword;

        }



        if (!string.IsNullOrWhiteSpace(request.Email))

        {

            var emailTaken = await _db.Users.AnyAsync(x => x.Email == request.Email && x.UserId != userId);

            if (emailTaken) return Conflict("Email уже занят.");

            user.Email = request.Email.Trim();

        }



        if (request.Phone != null)

            user.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();



        await _db.SaveChangesAsync();

        return Ok(BookingMappings.ToUserSummaryDto(user));

    }



    [HttpPatch("{userId:int}/reset-password")]

    public async Task<IActionResult> ResetPassword(int userId, [FromBody] ResetPasswordRequest request)

    {

        var user = await _db.Users.FirstOrDefaultAsync(x => x.UserId == userId);

        if (user is null) return NotFound("Пользователь не найден.");



        user.Password = request.NewPassword;

        await _db.SaveChangesAsync();

        return Ok("Пароль обновлён.");

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



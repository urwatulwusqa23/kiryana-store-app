using KiryanaStore.Application.Auth;
using KiryanaStore.Domain.Entities;
using KiryanaStore.Domain.Interfaces;
using KiryanaStore.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KiryanaStore.API.Controllers;

public record UserDto(int Id, string Username, string Role, string FullName, string Phone, bool IsActive, DateTime CreatedAt);
public record CreateUserDto(string Username, string Password, string Role, string FullName, string Phone);
public record UpdateUserDto(string FullName, string Phone, bool IsActive);

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Owner")]
public class UsersController(AppDbContext db, ICurrentUserContext currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? role)
    {
        var query = db.Users.AsQueryable();
        if (!string.IsNullOrWhiteSpace(role) && Enum.TryParse<UserRole>(role, true, out var parsedRole))
            query = query.Where(u => u.Role == parsedRole);

        var users = await query.OrderBy(u => u.FullName).ToListAsync();
        return Ok(users.Select(ToDto));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateUserDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new { error = "Username and password are required." });

        if (!Enum.TryParse<UserRole>(dto.Role, true, out var role) || role == UserRole.Owner)
            return BadRequest(new { error = "Role must be Employee or Rider." });

        if (await db.Users.IgnoreQueryFilters().AnyAsync(u => u.Username == dto.Username))
            return Conflict(new { error = "That username is already taken." });

        var user = new User
        {
            StoreId = currentUser.StoreId,
            Username = dto.Username,
            PasswordHash = PasswordHasher.Hash(dto.Password),
            Role = role,
            FullName = dto.FullName,
            Phone = dto.Phone,
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), ToDto(user));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateUserDto dto)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null) return NotFound();
        if (user.Role == UserRole.Owner) return BadRequest(new { error = "Cannot modify the store owner account." });

        user.FullName = dto.FullName;
        user.Phone = dto.Phone;
        user.IsActive = dto.IsActive;
        await db.SaveChangesAsync();
        return Ok(ToDto(user));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null) return NotFound();
        if (user.Role == UserRole.Owner) return BadRequest(new { error = "Cannot delete the store owner account." });

        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static UserDto ToDto(User u) => new(u.Id, u.Username, u.Role.ToString(), u.FullName, u.Phone, u.IsActive, u.CreatedAt);
}

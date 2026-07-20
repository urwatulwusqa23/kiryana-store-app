using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using KiryanaStore.API.Auth;
using KiryanaStore.Application.Auth;
using KiryanaStore.Domain.Entities;
using KiryanaStore.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace KiryanaStore.API.Controllers;

public record LoginDto(string Username, string Password);
public record RegisterStoreDto(string StoreName, string City, string Phone, string OwnerName, string Username, string Password);
public record LoginResponseDto(string Token, DateTime ExpiresAt, string Role, string StoreName, string FullName);

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class AuthController(AppDbContext db, IOptions<JwtOptions> jwtOptions) : ControllerBase
{
    [HttpPost("register-store")]
    public async Task<IActionResult> RegisterStore(RegisterStoreDto dto)
    {
        var jwt = jwtOptions.Value;
        if (string.IsNullOrEmpty(jwt.Secret))
            return StatusCode(500, new { error = "Auth is not configured on the server." });

        if (string.IsNullOrWhiteSpace(dto.StoreName) || string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new { error = "Store name, username and password are required." });

        // Usernames are unique across the whole platform for now, which keeps login simple
        // (no store slug needed at sign-in). Revisit if that becomes a real constraint.
        if (await db.Users.IgnoreQueryFilters().AnyAsync(u => u.Username == dto.Username))
            return Conflict(new { error = "That username is already taken." });

        var slug = await UniqueSlugAsync(dto.StoreName);
        var store = new Store { Name = dto.StoreName, Slug = slug, City = dto.City, Phone = dto.Phone };
        db.Stores.Add(store);
        await db.SaveChangesAsync();

        var user = new User
        {
            StoreId = store.Id,
            Username = dto.Username,
            PasswordHash = PasswordHasher.Hash(dto.Password),
            Role = UserRole.Owner,
            FullName = string.IsNullOrWhiteSpace(dto.OwnerName) ? dto.Username : dto.OwnerName,
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        return Ok(IssueToken(user, store, jwt));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var jwt = jwtOptions.Value;
        if (string.IsNullOrEmpty(jwt.Secret))
            return StatusCode(500, new { error = "Auth is not configured on the server." });

        var hash = PasswordHasher.Hash(dto.Password);
        var user = await db.Users.IgnoreQueryFilters().Include(u => u.Store)
            .FirstOrDefaultAsync(u => u.Username == dto.Username && u.IsActive);

        if (user is null || user.PasswordHash != hash)
            return Unauthorized(new { error = "Invalid username or password" });

        return Ok(IssueToken(user, user.Store, jwt));
    }

    private static LoginResponseDto IssueToken(User user, Store store, JwtOptions jwt)
    {
        var expires = DateTime.UtcNow.AddMinutes(jwt.ExpiryMinutes);
        var creds = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret)), SecurityAlgorithms.HmacSha256);
        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("storeId", user.StoreId.ToString()),
        };
        var token = new JwtSecurityToken(
            issuer: jwt.Issuer,
            audience: jwt.Issuer,
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        return new LoginResponseDto(new JwtSecurityTokenHandler().WriteToken(token), expires, user.Role.ToString(), store.Name, user.FullName);
    }

    private async Task<string> UniqueSlugAsync(string storeName)
    {
        var baseSlug = Regex.Replace(storeName.ToLowerInvariant(), "[^a-z0-9]+", "-").Trim('-');
        if (string.IsNullOrEmpty(baseSlug)) baseSlug = "store";

        var slug = baseSlug;
        var suffix = 1;
        while (await db.Stores.IgnoreQueryFilters().AnyAsync(s => s.Slug == slug))
            slug = $"{baseSlug}-{++suffix}";

        return slug;
    }
}

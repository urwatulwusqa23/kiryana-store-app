using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using KiryanaStore.API.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace KiryanaStore.API.Controllers;

public record LoginDto(string Username, string Password);
public record LoginResponseDto(string Token, DateTime ExpiresAt);

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class AuthController(IOptions<JwtOptions> jwtOptions, IOptions<AdminUserOptions> adminOptions) : ControllerBase
{
    [HttpPost("login")]
    public IActionResult Login(LoginDto dto)
    {
        var admin = adminOptions.Value;
        var jwt = jwtOptions.Value;

        if (string.IsNullOrEmpty(admin.Username) || string.IsNullOrEmpty(admin.PasswordHash) || string.IsNullOrEmpty(jwt.Secret))
            return StatusCode(500, new { error = "Auth is not configured on the server." });

        if (!string.Equals(dto.Username, admin.Username, StringComparison.Ordinal) ||
            !string.Equals(Hash(dto.Password), admin.PasswordHash, StringComparison.Ordinal))
            return Unauthorized(new { error = "Invalid username or password" });

        var expires = DateTime.UtcNow.AddMinutes(jwt.ExpiryMinutes);
        var creds = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret)), SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: jwt.Issuer,
            audience: jwt.Issuer,
            claims: [new Claim(ClaimTypes.Name, admin.Username)],
            expires: expires,
            signingCredentials: creds);

        return Ok(new LoginResponseDto(new JwtSecurityTokenHandler().WriteToken(token), expires));
    }

    private static string Hash(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}

using System.Security.Claims;
using KiryanaStore.Domain.Interfaces;

namespace KiryanaStore.API.Auth;

public class CurrentUserContext(IHttpContextAccessor httpContextAccessor) : ICurrentUserContext
{
    private ClaimsPrincipal? User => httpContextAccessor.HttpContext?.User;

    public int StoreId => int.TryParse(User?.FindFirst("storeId")?.Value, out var id) ? id : 0;
    public int UserId => int.TryParse(User?.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id) ? id : 0;
    public string Role => User?.FindFirst(ClaimTypes.Role)?.Value ?? "";
}

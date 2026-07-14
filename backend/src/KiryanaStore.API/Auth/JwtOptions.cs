namespace KiryanaStore.API.Auth;

public class JwtOptions
{
    public string Secret { get; set; } = "";
    public string Issuer { get; set; } = "KiryanaStore";
    public int ExpiryMinutes { get; set; } = 480;
}

public class AdminUserOptions
{
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";
}

namespace KiryanaStore.API.Auth;

public class JwtOptions
{
    public string Secret { get; set; } = "";
    public string Issuer { get; set; } = "KiryanaStore";
    public int ExpiryMinutes { get; set; } = 480;
}

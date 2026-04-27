namespace KiryanaStore.API;

public static class ConnectionStringResolver
{
    /// <summary>Resolves Npgsql connection string. Supports Render/Railway-style postgres:// URLs via DATABASE_URL.</summary>
    public static string? ResolveConnectionString(IConfiguration config)
    {
        var s = config.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrWhiteSpace(s))
            return s;
        s = config["DATABASE_URL"] ?? Environment.GetEnvironmentVariable("DATABASE_URL");
        if (string.IsNullOrWhiteSpace(s))
            return null;
        if (s.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
            s.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
            return ToNpgsqlConnectionString(s);
        return s;
    }

    private static string ToNpgsqlConnectionString(string databaseUrl)
    {
        var u = new Uri(databaseUrl);
        var userInfo = u.UserInfo.Split(':', 2);
        var user = Uri.UnescapeDataString(userInfo[0]);
        var pass = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
        var database = u.AbsolutePath.TrimStart('/');
        var port = u.IsDefaultPort ? 5432 : u.Port;
        return $"Host={u.Host};Port={port};Database={database};Username={user};Password={pass};SSL Mode=Require;Trust Server Certificate=true";
    }
}

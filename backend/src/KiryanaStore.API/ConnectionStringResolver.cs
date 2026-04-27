namespace KiryanaStore.API;

public static class ConnectionStringResolver
{
    /// <summary>Resolves Npgsql connection string. Render/Railway set DATABASE_URL; that must win over appsettings (which may list localhost for dev only).</summary>
    public static string? ResolveConnectionString(IConfiguration config)
    {
        // 1) PaaS: DATABASE_URL (or env) is authoritative on Render, Fly, Heroku, etc.
        var databaseUrl = config["DATABASE_URL"] ?? Environment.GetEnvironmentVariable("DATABASE_URL");
        if (!string.IsNullOrWhiteSpace(databaseUrl))
        {
            if (databaseUrl.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
                databaseUrl.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
                return ToNpgsqlConnectionString(databaseUrl);
            return databaseUrl;
        }

        // 2) appsettings / ConnectionStrings__DefaultConnection (local, Docker compose, etc.)
        var s = config.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrWhiteSpace(s))
            return s;

        return null;
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

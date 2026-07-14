namespace KiryanaStore.API;

public static class ConnectionStringResolver
{
    /// <summary>
    /// Resolves Npgsql connection string.
    /// Production: <c>DATABASE_URL</c> from Render/Railway wins when set.
    /// Development: <c>ConnectionStrings:DefaultConnection</c> wins so a machine-level <c>DATABASE_URL</c> does not override local Postgres.
    /// </summary>
    public static string? ResolveConnectionString(IConfiguration config)
    {
        var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? config["ASPNETCORE_ENVIRONMENT"];

        var defaultConnection = config.GetConnectionString("DefaultConnection");
        var isDevelopment = string.Equals(env, "Development", StringComparison.OrdinalIgnoreCase);

        if (isDevelopment && !string.IsNullOrWhiteSpace(defaultConnection))
            return defaultConnection;

        // PaaS: DATABASE_URL (or env) is authoritative on Render, Fly, Heroku, etc.
        var databaseUrl = config["DATABASE_URL"] ?? Environment.GetEnvironmentVariable("DATABASE_URL");
        if (!string.IsNullOrWhiteSpace(databaseUrl))
        {
            if (databaseUrl.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
                databaseUrl.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
                return ToNpgsqlConnectionString(databaseUrl);
            return databaseUrl;
        }

        if (!string.IsNullOrWhiteSpace(defaultConnection))
            return defaultConnection;

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

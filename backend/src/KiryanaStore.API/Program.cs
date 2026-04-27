using KiryanaStore.API;
using KiryanaStore.Application.Interfaces;
using KiryanaStore.Application.Services;
using KiryanaStore.Domain.Entities;
using KiryanaStore.Domain.Interfaces;
using KiryanaStore.Infrastructure.Data;
using KiryanaStore.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString = ConnectionStringResolver.ResolveConnectionString(builder.Configuration)
    ?? "Host=localhost;Port=5432;Database=kiryanadb;Username=kiryana;Password=devlocal123";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Repositories
builder.Services.AddScoped<ICustomerRepository, CustomerRepository>();
builder.Services.AddScoped<IItemRepository, ItemRepository>();
builder.Services.AddScoped<IPurchaseRepository, PurchaseRepository>();
builder.Services.AddScoped<ISaleRepository, SaleRepository>();
builder.Services.AddScoped<IRepository<Supplier>, GenericRepository<Supplier>>();
builder.Services.AddScoped<IRepository<CreditTransaction>, GenericRepository<CreditTransaction>>();

// Services
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<IItemService, ItemService>();
builder.Services.AddScoped<ISupplierService, SupplierService>();
builder.Services.AddScoped<IPurchaseService, PurchaseService>();
builder.Services.AddScoped<ISaleService, SaleService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowAll");

var wwwroot = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
var hasSpa = File.Exists(Path.Combine(wwwroot, "index.html"));
if (hasSpa)
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

app.UseAuthorization();
app.MapControllers();

if (hasSpa)
    app.MapFallbackToFile("index.html");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    await DataSeeder.SeedAsync(db);
}

app.Run();

using Microsoft.EntityFrameworkCore;
using Hotel.Data;
using Hotel.Storage;
using System.Text.Json;

namespace Hotel
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            var applySqlSchemaOnStartup = builder.Configuration.GetValue("DatabaseInitialization:ApplySqlSchemaOnStartup", true);
            var seedDemoData = builder.Configuration.GetValue("DatabaseInitialization:SeedDemoData", true);

            builder.Services.AddDbContext<AppDbContext>(opt =>
                opt.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
                });
            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(policy =>
                    policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
            });

            var app = builder.Build();

            using (var scope = app.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                db.Database.EnsureCreated();

                var schemaPath = Path.Combine(app.Environment.ContentRootPath, "postgresql_schema.sql");
                if (applySqlSchemaOnStartup && File.Exists(schemaPath))
                {
                    var schemaSql = File.ReadAllText(schemaPath);
                    db.Database.ExecuteSqlRaw(schemaSql);
                }

                if (seedDemoData)
                {
                    await DbSeeder.SeedAsync(db);
                }
            }

            app.UseHttpsRedirection();
            app.UseDefaultFiles();
            app.UseStaticFiles();

            app.UseRouting();
            app.UseCors();

            app.MapGet("/api/health", () => Results.Ok("Hotel API is running"));
            app.MapControllers();

            app.Run();
        }
    }
}

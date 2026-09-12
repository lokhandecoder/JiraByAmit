using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using PersonalJira.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Serialize enums as strings (e.g. "Draft", "UserStory", "Defect")
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// Configure PostgreSQL Database Context
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5432;Database=personal_jira_db;Username=postgres;Password=postgres";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorCodesToAdd: null);
    }));

// Configure CORS for web frontends (AI Studio, local dev, custom domains)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Personal Jira .NET Core Web API",
        Version = "v1",
        Description = "Production RESTful API for personal Jira task tracking with PostgreSQL, sprint planning, and reporting modules.",
        Contact = new OpenApiContact
        {
            Name = "Engineering Team",
            Email = "admin@personaljira.dev"
        }
    });

    // Support enum display in Swagger
    c.DescribeAllParametersInCamelCase();
});

var app = builder.Build();

// Auto-migrate database on application startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.EnsureCreated();
        app.Logger.LogInformation("PostgreSQL database ensured and initialized successfully.");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "An error occurred while creating or migrating the PostgreSQL database.");
    }
}

// Configure HTTP request pipeline
if (app.Environment.IsDevelopment() || true) // Swagger enabled for developer inspection
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Personal Jira API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseCors("AllowAllOrigins");

app.UseRouting();

app.UseAuthorization();

app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new
{
    status = "Healthy",
    service = "Personal Jira .NET Core Web API",
    database = "PostgreSQL via Npgsql EF Core",
    timestamp = DateTime.UtcNow
}));

app.Run();

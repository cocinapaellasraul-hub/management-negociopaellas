// ARCHIVO: Program.cs
using System.Text;
using BackendApi.Data;
using BackendApi.Hubs;
using BackendApi.Models;
using BackendApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

// ⚙️ LÓGICA: WebApplication.CreateBuilder prepara el servidor web interno (Kestrel)
// y nos da acceso al contenedor de servicios y configuraciones.
var builder = WebApplication.CreateBuilder(args);

// 🎓 NOTA PARA EL TFG: "Configuración de la Base de Datos. Extraigo la cadena de conexión de forma segura
// desde el appsettings.json. Inyecto AppDbContext usando el proveedor de PostgreSQL (Npgsql),
// lo que permite cambiar de base de datos en el futuro sin reescribir la lógica de la aplicación."
var connectionString = builder.Configuration.GetConnectionString("NeonDb");
builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

// 🎓 NOTA PARA EL TFG: "Patrón de Inyección de Dependencias (DI) e Inversión de Control (IoC).
// Uso 'AddScoped' para que C# cree una instancia nueva de estos servicios por cada petición HTTP que reciba el servidor.
// Esto asegura que los datos no se mezclen entre distintos usuarios que compren a la vez."
builder.Services.AddScoped<PedidosService>();
builder.Services.AddScoped<ContactoService>();

// ✨ NUEVO: Registramos el motor de correos
builder.Services.AddScoped<EmailService>();

builder.Services.AddControllers();
builder.Services.AddSignalR();

// 🎓 NOTA PARA EL TFG: "Configuración estricta de Autenticación JWT.
// El servidor no confía en cualquier token. Valida 4 cosas antes de dejar pasar la petición:
// 1. Que el Emisor (Issuer) sea el correcto.
// 2. Que la Audiencia (Audience) sea la correcta.
// 3. Que el token no haya caducado (Lifetime).
// 4. Que la firma criptográfica coincida con la clave secreta del servidor."
var jwtKey = builder.Configuration["Jwt:Key"] ?? "ClaveDeRespaldoPorSiFallaElAppSettings2026";
builder
    .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        };
    });
builder.Services.AddAuthorization();

// ⚙️ LÓGICA: Hasta aquí le hemos dicho al Builder TODO lo que necesitamos. Ahora construimos la App real.
var app = builder.Build();

// 🎓 NOTA PARA EL TFG: "Estrategia de Inicialización de Base de Datos.
// Utilizo EnsureCreated() al arrancar la app. Esto revisa si las tablas en Neon (PostgreSQL) existen
// basándose en mis Modelos (C#). Si no existen, las crea automáticamente. Es ideal para despliegues rápidos en la nube."
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.EnsureCreated();
}

// 🎓 NOTA PARA EL TFG: "Configuración de CORS (Cross-Origin Resource Sharing).
// Por seguridad, los navegadores bloquean peticiones entre distintos puertos (ej: Astro en puerto 4321 hacia C# en puerto 5086).
// Esta política permite la comunicación fluida entre el frontend y el backend, habilitando 'AllowCredentials' específicamente
// para que el túnel de WebSockets (SignalR) pueda establecerse."
app.UseCors(policy =>
    policy.SetIsOriginAllowed(origin => true).AllowAnyHeader().AllowAnyMethod().AllowCredentials()
);

// ⚙️ LÓGICA: El Middleware Pipeline (Tubería). El orden aquí es SAGRADO.
// Primero preguntamos "¿Quién eres?" (Authentication).
// Luego preguntamos "¿Tienes permiso para entrar aquí?" (Authorization).
app.UseAuthentication();
app.UseAuthorization();

// ⚙️ LÓGICA: Finalmente, enrutamos las peticiones hacia sus destinos finales.
app.MapControllers(); // Las peticiones /api/... van a la carpeta Controllers.
app.MapHub<CocinaHub>("/cocinahub"); // Las peticiones WebSockets van al Hub.
app.MapGet("/", () => "Backend de Paellas Raúl - Activo, Seguro y Enviando Emails");

// Arrancamos el motor.
app.Run();

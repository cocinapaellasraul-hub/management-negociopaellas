// ARCHIVO: Data/AppDbContext.cs
using BackendApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BackendApi.Data
{
    // 🎓 NOTA PARA EL TFG: "Esta clase hereda de DbContext, que es la pieza central de Entity Framework Core (EF Core).
    // Actúa implementando el patrón ORM (Object-Relational Mapping). Su función es traducir automáticamente
    // nuestro código orientado a objetos en C# a consultas SQL nativas que PostgreSQL (Neon) pueda ejecutar."
    public class AppDbContext : DbContext
    {
        // ⚙️ LÓGICA: El constructor recibe las opciones de configuración (como la cadena de conexión
        // que guardamos en appsettings.json) desde el Program.cs y se las inyecta al motor interno de Microsoft.
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        // 🎓 NOTA PARA EL TFG: "Los DbSet representan las tablas físicas en la base de datos.
        // Gracias a esto, en lugar de escribir sentencias como 'SELECT * FROM Pedidos', puedo utilizar
        // expresiones LINQ en C# (ej: _context.Pedidos.ToList()). Esto no solo agiliza el desarrollo,
        // sino que protege el sistema contra ataques de Inyección SQL, ya que EF Core parametriza los datos de forma segura."

        // Tabla de la base de datos para el catálogo (La Carta)
        public DbSet<Paella> Paellas { get; set; }

        // Tabla de la base de datos para almacenar las comandas
        public DbSet<Pedido> Pedidos { get; set; }

        // Tabla de la base de datos para el buzón de contacto
        public DbSet<MensajeContacto> MensajesContacto { get; set; }
    }
}

// ARCHIVO: Services/ContactoService.cs
using BackendApi.Data;
using BackendApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BackendApi.Services
{
    // 🎓 NOTA PARA EL TFG: "La creación de esta capa de Servicios obedece al Principio de Responsabilidad Única (SRP)
    // de los principios SOLID. En lugar de ensuciar los Controladores con lógica de base de datos,
    // delegamos toda la persistencia a estas clases especializadas, haciendo el código mucho más testeable y mantenible."
    public class ContactoService
    {
        private readonly AppDbContext _context;

        // ⚙️ LÓGICA: Inyección de dependencias. C# nos proporciona la conexión a la base de datos
        // automáticamente al instanciar este servicio.
        public ContactoService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<MensajeContacto>> ObtenerTodos()
        {
            // 🎓 NOTA PARA EL TFG: "Utilizo OrderByDescending(m => m.Id) para que, al cargar el panel de administración,
            // los mensajes más recientes aparezcan siempre al principio de la lista, mejorando la UX de Raúl."
            return await _context.MensajesContacto.OrderByDescending(m => m.Id).ToListAsync();
        }

        public async Task<MensajeContacto> NuevoMensaje(MensajeContacto mensaje)
        {
            _context.MensajesContacto.Add(mensaje);
            await _context.SaveChangesAsync();
            return mensaje;
        }

        public async Task<bool> ActualizarEstado(int id, string nuevoEstado)
        {
            // ⚙️ LÓGICA: FindAsync es la forma más rápida y eficiente de buscar una única fila por su Clave Primaria.
            var mensaje = await _context.MensajesContacto.FindAsync(id);
            if (mensaje == null)
            {
                return false; // Si no existe, devolvemos false para que el controlador lance un 404 Not Found.
            }

            // 🎓 NOTA PARA EL TFG: "Gracias a Entity Framework Core, no necesito escribir sentencias UPDATE.
            // EF rastrea (Track) los cambios en el objeto 'mensaje' en memoria, y al llamar a SaveChangesAsync(),
            // genera el SQL exacto para actualizar solo la columna Estado."
            mensaje.Estado = nuevoEstado;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}

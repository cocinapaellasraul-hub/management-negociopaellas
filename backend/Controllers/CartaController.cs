// ARCHIVO: Controllers/CartaController.cs
using BackendApi.Data;
using BackendApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BackendApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CartaController : ControllerBase
    {
        // ⚙️ LÓGICA: Aquí SÍ nos saltamos un poco la regla de "los controladores no tocan la base de datos".
        // Para operaciones muy simples (CRUD básico de un plato), a veces es aceptable usar el AppDbContext directamente
        // en el controlador para ahorrar crear un Servicio entero solo para esto.
        private readonly AppDbContext _context;

        public CartaController(AppDbContext context)
        {
            _context = context;
        }

        // VER LA CARTA (Lo que usa Astro) -> MANTIENE ACCESO PÚBLICO
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Paella>>> GetCarta()
        {
            // 🎓 NOTA PARA EL TFG: "La consulta a la base de datos la hago asíncrona (ToListAsync)
            // para no bloquear los hilos (threads) del servidor C# mientras espera que Neon responda."
            return await _context.Paellas.OrderBy(p => p.Categoria).ToListAsync();
        }

        // INSERTAR NUEVO PLATO (Panel de control) -> PROTEGIDO
        [HttpPost]
        // 🎓 NOTA PARA EL TFG: "La etiqueta [Authorize] actúa como un muro de contención.
        // Si la petición HTTP no trae el Token JWT en la cabecera, el servidor ni siquiera ejecuta este código,
        // devuelve un error 401 automáticamente, protegiendo mi base de datos de inyecciones de platos falsos."
        [Authorize]
        public async Task<ActionResult<Paella>> PostPlato(Paella nuevoPlato)
        {
            _context.Paellas.Add(nuevoPlato);
            await _context.SaveChangesAsync();
            return Ok(nuevoPlato);
        }

        // MODIFICAR PLATO EXISTENTE (Panel de control) -> PROTEGIDO
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> PutPlato(int id, Paella platoActualizado)
        {
            // ⚙️ LÓGICA: Medida de seguridad. Si me mandas en la URL la ID 5, pero en los datos
            // del plato me dices que es la ID 9, sospecho manipulación y devuelvo un BadRequest (Error 400).
            if (id != platoActualizado.Id)
                return BadRequest();

            _context.Entry(platoActualizado).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Paellas.Any(e => e.Id == id))
                    return NotFound();
                else
                    throw;
            }
            return NoContent(); // Código 204: "Todo ha ido bien, no tengo nada más que decirte".
        }

        // BORRAR PLATO (Panel de control) -> PROTEGIDO
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeletePlato(int id)
        {
            var plato = await _context.Paellas.FindAsync(id);
            if (plato == null)
                return NotFound(); // Código 404

            _context.Paellas.Remove(plato);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

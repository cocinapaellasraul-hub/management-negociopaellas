// ARCHIVO: Controllers/ContactoController.cs
using BackendApi.Hubs;
using BackendApi.Models;
using BackendApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace BackendApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContactoController : ControllerBase
    {
        private readonly ContactoService _contactoService;
        private readonly IHubContext<CocinaHub> _hubContext; // El intercomunicador

        // ⚙️ LÓGICA: Inyectamos el Servicio de Contactos (el que trabaja) y el Hub (el walkie-talkie).
        public ContactoController(
            ContactoService contactoService,
            IHubContext<CocinaHub> hubContext
        )
        {
            _contactoService = contactoService;
            _hubContext = hubContext;
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<List<MensajeContacto>>> Get()
        {
            var mensajes = await _contactoService.ObtenerTodos();
            return Ok(mensajes);
        }

        [HttpPost]
        public async Task<ActionResult> Post(MensajeContacto mensaje)
        {
            if (string.IsNullOrEmpty(mensaje.Estado))
            {
                mensaje.Estado = "pendientes";
            }

            // 1. Guarda el mensaje en base de datos
            var info = await _contactoService.NuevoMensaje(mensaje);

            // 🎓 NOTA PARA EL TFG: "La comunicación WebSockets (SignalR) va ligada al ciclo de vida del Controlador.
            // Inmediatamente después de que Entity Framework confirme la persistencia en PostgreSQL,
            // el controlador empuja el nuevo objeto (info) a través del Hub hacia todos los clientes conectados (React)."
            await _hubContext.Clients.All.SendAsync("NuevoMensaje", info);

            return Ok(info);
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult> Put(int id, [FromBody] ActualizarEstadoMensajeDto dto)
        {
            try
            {
                var resultado = await _contactoService.ActualizarEstado(id, dto.Estado);

                if (resultado)
                    return Ok(new { message = "Estado del mensaje actualizado correctamente" });

                return NotFound($"No se encontró el mensaje con ID {id}");
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al actualizar el mensaje: {ex.Message}");
            }
        }
    }

    // DTO para recoger solo el string del estado sin traernos el mensaje entero
    public class ActualizarEstadoMensajeDto
    {
        public string Estado { get; set; } = string.Empty;
    }
}

// ARCHIVO: Controllers/PedidosController.cs
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
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
    public class PedidosController : ControllerBase
    {
        private readonly PedidosService _pedidosService;
        private readonly IHubContext<CocinaHub> _hubContext;

        public PedidosController(PedidosService pedidosService, IHubContext<CocinaHub> hubContext)
        {
            _pedidosService = pedidosService;
            _hubContext = hubContext;
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<List<Pedido>>> Get()
        {
            try
            {
                var lista = await _pedidosService.ObtenerTodos();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al obtener pedidos: {ex.Message}");
            }
        }

        // ✨ NUEVA LÓGICA: Ruta GET para que React pregunte si hay hueco en una fecha específica
        [HttpGet("disponibilidad/{fecha}")]
        public async Task<IActionResult> ComprobarDisponibilidad(string fecha)
        {
            bool disponible = await _pedidosService.HayCupoDisponible(fecha);
            return Ok(new { disponible = disponible });
        }

        [HttpPost]
        public async Task<ActionResult> Post(Pedido pedido)
        {
            try
            {
                if (string.IsNullOrEmpty(pedido.Estado))
                {
                    pedido.Estado = "pendiente";
                }

                var info = await _pedidosService.NuevoPedido(pedido);

                // 🎓 NOTA PARA EL TFG: "Al igual que con los mensajes, el pedido se difunde en tiempo real.
                // Uso Clients.All para que si, en un futuro, el administrador tiene el panel abierto
                // en el móvil y en la tablet a la vez, el aviso salte simultáneamente en ambas pantallas."
                await _hubContext.Clients.All.SendAsync("NuevoPedido", info);

                return Ok(info);
            }
            catch (InvalidOperationException ex)
            {
                // Captura fallos de restricciones temporales o superación de los cupos máximos permitidos
                return BadRequest(new { error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                // Captura el envío de datos de fechas en formatos corruptos o días de la semana inválidos
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                // Captura fallos genéricos imprevistos del sistema o de la conexión con la base de datos
                return StatusCode(500, $"Error interno al procesar la comanda: {ex.Message}");
            }
        }

        // Modificar todo el pedido
        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult> Put(int id, [FromBody] Pedido pedidoActualizado)
        {
            try
            {
                var resultado = await _pedidosService.ActualizarPedido(id, pedidoActualizado);
                if (resultado)
                    return Ok(new { message = "Pedido actualizado correctamente" });
                return NotFound($"No se encontró el pedido con ID {id}");
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al actualizar: {ex.Message}");
            }
        }

        // Modificar SOLO el estado (Cocinar -> Lista)
        [HttpPut("{id}/estado")]
        [Authorize]
        public async Task<ActionResult> CambiarEstado(int id, [FromBody] ActualizarEstadoDto dto)
        {
            try
            {
                // ⚙️ LÓGICA: En lugar de enviar un objeto Pedido enorme vacío desde React,
                // mandamos solo el estado. Aquí creamos un "Pedido falso" que solo tiene
                // el estado relleno para engañar a nuestro Servicio y que lo actualice.
                var pedidoParcial = new Pedido { Estado = dto.Estado };
                var resultado = await _pedidosService.ActualizarPedido(id, pedidoParcial);

                if (resultado)
                    return Ok(new { message = "Estado actualizado" });
                return NotFound($"No se encontró el pedido con ID {id}");
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al actualizar el estado: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<ActionResult> Delete(int id)
        {
            try
            {
                var resultado = await _pedidosService.EliminarPedido(id);
                if (resultado)
                    return Ok(new { message = "Pedido eliminado" });
                return NotFound($"No se encontró el pedido con ID {id}");
            }
            catch (Exception ex)
            {
                return BadRequest($"Error al eliminar: {ex.Message}");
            }
        }
    }

    public class ActualizarEstadoDto
    {
        public string Estado { get; set; } = string.Empty;
    }
}

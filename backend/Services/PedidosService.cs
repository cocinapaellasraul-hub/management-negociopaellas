// ARCHIVO: Services/PedidosService.cs
using System;
using BackendApi.Data;
using BackendApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BackendApi.Services
{
    public class PedidosService
    {
        private readonly AppDbContext _context;
        private readonly EmailService _emailService;

        // 🎓 NOTA PARA EL TFG: "Los Servicios pueden inyectarse entre si.
        // Aquí inyecto el EmailService dentro del PedidosService. De esta forma,
        // puedo vincular la acción de cambiar el estado de un pedido directamente con el envío del correo."
        public PedidosService(AppDbContext context, EmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        public async Task<List<Pedido>> ObtenerTodos()
        {
            return await _context.Pedidos.OrderByDescending(p => p.Id).ToListAsync();
        }

        public async Task<Pedido> NuevoPedido(Pedido pedido)
        {
            // ⚙️ LÓGICA 1: Restricción de captación (Solo se puede pedir de Lunes a Jueves)
            // 🎓 NOTA PARA EL TFG: "Para evitar fallos de desfase horario si el servidor en la nube de Neon/AWS
            // utiliza una hora del sistema distinta, empleamos TimeZoneInfo para forzar el cálculo basándonos
            // estrictamente en la hora oficial de la España peninsular (Romance Standard Time)."
            var zonaEspana = TimeZoneInfo.FindSystemTimeZoneById("Romance Standard Time");
            var horaActualEspana = TimeZoneInfo.ConvertTime(DateTime.UtcNow, zonaEspana);
            DayOfWeek diaActual = horaActualEspana.DayOfWeek;

            /*if (
                diaActual == DayOfWeek.Friday
                || diaActual == DayOfWeek.Saturday
                || diaActual == DayOfWeek.Sunday
            )
            {
                throw new InvalidOperationException(
                    "La recepción de pedidos en línea está cerrada. Las reservas solo están operativas de lunes a jueves."
                );
            }*/

            // ⚙️ LÓGICA 2: Restricción del día de entrega (Solo Viernes, Sábado o Domingo)
            if (DateTime.TryParse(pedido.Fecha, out DateTime fechaEntrega))
            {
                DayOfWeek diaEntrega = fechaEntrega.DayOfWeek;
                if (
                    diaEntrega != DayOfWeek.Friday
                    && diaEntrega != DayOfWeek.Saturday
                    && diaEntrega != DayOfWeek.Sunday
                )
                {
                    throw new ArgumentException(
                        "Operación inválida. Los arroces se cocinan exclusivamente los fines de semana (viernes, sábado y domingo)."
                    );
                }
            }
            else
            {
                throw new ArgumentException(
                    "El formato de la fecha de entrega proporcionado no es válido."
                );
            }

            // ⚙️ LÓGICA 3: Control dinámico del cupo de producción (Máximo 10 paellas al día)
            // 🎓 NOTA PARA EL TFG: "Al utilizar un modelo desnormalizado, el semáforo del cupo se calcula 'al vuelo'.
            // Mediante el método asíncrono CountAsync de Entity Framework Core, contamos en tiempo real las filas existentes
            // para la fecha solicitada. Si el contador alcanza el límite de 10, disparamos una excepción bloqueando la transacción."
            int totalPedidosParaEsaFecha = await _context.Pedidos.CountAsync(p =>
                p.Fecha == pedido.Fecha
            );
            if (totalPedidosParaEsaFecha >= 10)
            {
                throw new InvalidOperationException(
                    $"Cupo máximo completado. Lo sentimos, se ha alcanzado el límite estricto de 10 paellas para el día {pedido.Fecha}."
                );
            }

            _context.Pedidos.Add(pedido);
            await _context.SaveChangesAsync();
            return pedido;
        }

        // ✨ NUEVA LÓGICA: Método rápido para comprobar si un día está lleno antes de iniciar la compra
        public async Task<bool> HayCupoDisponible(string fecha)
        {
            int totalPedidosParaEsaFecha = await _context.Pedidos.CountAsync(p => p.Fecha == fecha);
            return totalPedidosParaEsaFecha < 10;
        }

        public async Task<bool> ActualizarPedido(int id, Pedido pedidoActualizado)
        {
            var pedidoExistente = await _context.Pedidos.FindAsync(id);

            if (pedidoExistente == null)
            {
                return false;
            }

            // ⚙️ LÓGICA: Comprobamos si el estado que manda React es diferente al que ya teníamos.
            // Si estaba "cocinando" y mandan "cocinando", estadoCambiado será false y no enviaremos 100 correos repetidos.
            bool estadoCambiado = pedidoExistente.Estado != pedidoActualizado.Estado;

            pedidoExistente.Estado = pedidoActualizado.Estado;

            // 🎓 NOTA PARA EL TFG: "Una vez que guardo el nuevo estado en la base de datos de forma permanente..."
            await _context.SaveChangesAsync();

            if (estadoCambiado)
            {
                // 🎓 NOTA PARA EL TFG: "...disparo el proceso de envío de correos.
                // Utilizo el operador de descarte '_' (Fire and Forget) para lanzar el proceso en segundo plano.
                // Así, el administrador no tiene que quedarse esperando 2 segundos a que Gmail responda para que su panel reaccione."
                _ = _emailService.EnviarEmailEstado(pedidoExistente);
            }

            return true;
        }

        public async Task<bool> EliminarPedido(int id)
        {
            var pedidoExistente = await _context.Pedidos.FindAsync(id);

            if (pedidoExistente == null)
            {
                return false;
            }

            _context.Pedidos.Remove(pedidoExistente);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}

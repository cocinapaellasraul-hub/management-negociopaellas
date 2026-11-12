// ARCHIVO: Controllers/TicketController.cs
using BackendApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace BackendApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TicketController : ControllerBase
    {
        private readonly PedidosService _pedidosService;

        public TicketController(PedidosService pedidosService)
        {
            _pedidosService = pedidosService;

            // 🎓 NOTA PARA EL TFG: "La librería QuestPDF requiere definir el tipo de licencia por motivos legales.
            // Se declara explicitamente LicenseType.Community ya que este es un proyecto académico sin afán de lucro."
            QuestPDF.Settings.License = LicenseType.Community;
        }

        [HttpGet("{id}")]
        [Authorize] // Protegemos el ticket con JWT para que solo tú puedas descargarlo
        public async Task<IActionResult> GenerarTicket(int id)
        {
            var pedidos = await _pedidosService.ObtenerTodos();
            var pedido = pedidos.FirstOrDefault(p => p.Id == id);

            if (pedido == null)
                return NotFound("Pedido no encontrado");

            // 🎓 NOTA PARA EL TFG: "Para la generación del ticket opté por la librería QuestPDF
            // debido a su arquitectura fluida (Fluent API). Permite 'dibujar' el documento mediante columnas
            // y tablas de forma muy similar a como se construiría un diseño en Flexbox (CSS)."
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    // Tamaño continuo para simular el rollo de papel (72mm de ancho imprimible)
                    page.ContinuousSize(72, Unit.Millimetre);
                    page.Margin(4, Unit.Millimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Arial));

                    page.Content()
                        .Column(col =>
                        {
                            // 1. CABECERA
                            col.Item().AlignCenter().Text("Arrozeo").Bold().FontSize(18);
                            col.Item().AlignCenter().Text("El Refugio del Sabor").FontSize(10);
                            col.Item()
                                .PaddingBottom(10)
                                .AlignCenter()
                                .Text("Ticket de Caja")
                                .FontSize(10)
                                .FontColor(Colors.Grey.Medium);

                            col.Item().LineHorizontal(1f);

                            // 2. DATOS DEL PEDIDO Y CLIENTE
                            col.Item()
                                .PaddingVertical(5)
                                .Column(c =>
                                {
                                    // ⚙️ LÓGICA: .ToString("D4") convierte el ID '5' en '#0005'. Queda mucho más profesional.
                                    c.Item().Text($"Comanda: #{pedido.Id.ToString("D4")}").Bold();
                                    c.Item().Text($"Fecha: {pedido.Fecha} - {pedido.Hora}");
                                    c.Item().Text($"Cliente: {pedido.NombreCliente}");
                                    c.Item().Text($"Teléfono: {pedido.TelefonoCliente}");

                                    if (
                                        !string.IsNullOrEmpty(pedido.MetodoEntrega)
                                        && pedido.MetodoEntrega.ToLower().Contains("domicilio")
                                    )
                                    {
                                        c.Item().Text($"Envío a: {pedido.Direccion}");
                                    }
                                });

                            col.Item().LineHorizontal(1f);

                            // 3. DESGLOSE DE PRODUCTOS (Tabla)
                            col.Item()
                                .PaddingVertical(5)
                                .Table(tabla =>
                                {
                                    tabla.ColumnsDefinition(columns =>
                                    {
                                        columns.ConstantColumn(20); // Columna Cantidad (Estrecha)
                                        columns.RelativeColumn(); // Columna Concepto (Coge todo el centro)
                                        columns.ConstantColumn(40); // Columna Precio Total (Estrecha)
                                    });

                                    // Arroz
                                    tabla.Cell().Text($"{pedido.Raciones}x");
                                    tabla
                                        .Cell()
                                        .Text(
                                            $"{pedido.NombreArroz}{(pedido.Socarrat ? " (+Soc)" : "")}"
                                        );
                                    tabla
                                        .Cell()
                                        .AlignRight()
                                        .Text(
                                            $"{((pedido.PrecioPersona * pedido.Raciones)).ToString("0.00")}€"
                                        );

                                    // Postres
                                    if (pedido.RacionesTartaQueso > 0)
                                    {
                                        tabla.Cell().Text($"{pedido.RacionesTartaQueso}x");
                                        tabla.Cell().Text("Tarta de Queso");
                                        tabla
                                            .Cell()
                                            .AlignRight()
                                            .Text(
                                                $"{(pedido.RacionesTartaQueso * 4).ToString("0.00")}€"
                                            );
                                    }
                                    if (pedido.RacionesFlanHuevo > 0)
                                    {
                                        tabla.Cell().Text($"{pedido.RacionesFlanHuevo}x");
                                        tabla.Cell().Text("Flan Casero");
                                        tabla
                                            .Cell()
                                            .AlignRight()
                                            .Text(
                                                $"{(pedido.RacionesFlanHuevo * 4).ToString("0.00")}€"
                                            );
                                    }

                                    // Envío
                                    if (
                                        !string.IsNullOrEmpty(pedido.MetodoEntrega)
                                        && pedido.MetodoEntrega.ToLower().Contains("domicilio")
                                    )
                                    {
                                        tabla.Cell().Text("1x");
                                        tabla.Cell().Text("Suplemento Domicilio");
                                        tabla.Cell().AlignRight().Text("5.00€");
                                    }
                                });

                            col.Item().LineHorizontal(1f);

                            // 4. TOTALES
                            col.Item()
                                .PaddingTop(5)
                                .AlignRight()
                                .Text($"TOTAL: {pedido.PrecioTotal.ToString("0.00")}€")
                                .Bold()
                                .FontSize(14);
                            col.Item()
                                .AlignRight()
                                .Text($"Método de Pago: {pedido.MetodoPago}")
                                .FontSize(9);

                            // 5. PIE DE TICKET
                            col.Item()
                                .PaddingTop(15)
                                .AlignCenter()
                                .Text("¡Gracias por su visita!")
                                .Italic()
                                .FontSize(10);
                            col.Item()
                                .AlignCenter()
                                .Text("IVA incluido en todos los precios")
                                .FontSize(8)
                                .FontColor(Colors.Grey.Medium);
                        });
                });
            });

            // ⚙️ LÓGICA: Convertimos el diseño a un array de bytes (datos puros) y le decimos a C# que lo
            // envíe al cliente simulando que es un archivo físico ('application/pdf').
            byte[] pdfBytes = document.GeneratePdf();
            return File(pdfBytes, "application/pdf", $"Ticket_Arrozeo_#{pedido.Id:D4}.pdf");
        }
    }
}

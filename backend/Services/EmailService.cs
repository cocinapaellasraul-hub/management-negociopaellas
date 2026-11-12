// ARCHIVO: Services/EmailService.cs
using BackendApi.Models;
using MailKit.Net.Smtp;
using MimeKit;

namespace BackendApi.Services
{
    public class EmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        // 🎓 NOTA PARA EL TFG: "Implementé un sistema de notificaciones automáticas mediante la librería MailKit,
        // que es la recomendada oficialmente por Microsoft. Permite la composición de correos ricos en HTML (MimeKit)
        // y su envío seguro a través del protocolo SMTP."
        public async Task EnviarEmailEstado(Pedido pedido)
        {
            // ⚙️ LÓGICA: Programación defensiva. Si el cliente no dejó email o puso "asdf",
            // abortamos la función silenciosamente para no intentar enviar un correo a la nada y hacer petar el servidor.
            if (string.IsNullOrEmpty(pedido.Email) || !pedido.Email.Contains("@"))
                return;

            var emailMessage = new MimeMessage();

            var fromEmail = _config["EmailConfig:FromEmail"] ?? "paellasraul@gmail.com";
            var nombreCliente = string.IsNullOrEmpty(pedido.NombreCliente)
                ? "Cliente"
                : pedido.NombreCliente;

            emailMessage.From.Add(new MailboxAddress("Arrozeo", fromEmail));
            emailMessage.To.Add(new MailboxAddress(nombreCliente, pedido.Email!));

            string asunto = "";
            string cuerpoHtml = "";

            bool esDomicilio =
                !string.IsNullOrEmpty(pedido.MetodoEntrega)
                && pedido.MetodoEntrega.ToLower().Contains("domicilio");

            // ⚙️ LÓGICA: Estandarizamos el texto a minúsculas y sin espacios a los lados
            // por si se guardó en la base de datos como " Cocinando" o "COCINANDO".
            string estadoLimpio = pedido.Estado?.ToLower().Trim() ?? "";

            // 🎓 NOTA PARA EL TFG: "He diseñado una plantilla de correo (Template) dinámica en HTML en línea.
            // Usando interpolación de cadenas ($""), el contenido del correo cambia adaptativamente:
            // inyecta el nombre del cliente y oculta o muestra la dirección de envío dependiendo de si eligió recogida o domicilio."
            if (estadoLimpio == "cocinando")
            {
                asunto = "🔥 ¡Tu paella ya está al fuego!";

                string infoEntrega = esDomicilio
                    ? $"<p style='margin-top: 15px; font-size: 15px; color: #555;'>📍 <strong>Para entregar en:</strong><br>{pedido.Direccion}</p>"
                    : "<p style='margin-top: 15px; font-size: 15px; color: #555;'>🏪 <strong>Para recoger en local</strong></p>";

                cuerpoHtml =
                    $@"
                    <div style='font-family: Arial, sans-serif; padding: 20px; text-align: center; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 15px;'>
                        <h2 style='color: #d35400; font-style: italic;'>¡Oído Cocina, {nombreCliente}!</h2>
                        <p style='color: #555; font-size: 16px;'>Queríamos avisarte de que Raúl acaba de ponerse manos a la obra con tu pedido.</p>
                        <div style='background-color: #fff3e0; padding: 15px; border-radius: 10px; margin: 20px 0;'>
                            <p style='margin: 0; font-weight: bold; font-size: 18px;'>{pedido.Raciones}x {pedido.NombreArroz}</p>
                            {infoEntrega}
                        </div>
                        <p style='color: #777; font-size: 14px;'>Te enviaremos un último aviso en cuanto esté lista.</p>
                    </div>";
            }
            else if (estadoLimpio == "entregado")
            {
                asunto = "✅ ¡Tu pedido está en camino!";

                string mensajeEntrega = esDomicilio
                    ? "Nuestro repartidor ya está de camino con el pedido bien caliente."
                    : "Ya puedes pasar por el local a recoger tu paella.";

                string saludoYDireccion = esDomicilio
                    ? $"<p style='color: #555; font-size: 16px; line-height: 1.5;'>Hola {nombreCliente}, la espera ha terminado.<br>Tu pedido va directo hacia: <br><strong style='color: #333;'>📍 {pedido.Direccion}</strong></p>"
                    : $"<p style='color: #555; font-size: 16px;'>Hola {nombreCliente}, la espera ha terminado.</p>";

                cuerpoHtml =
                    $@"
                    <div style='font-family: Arial, sans-serif; padding: 20px; text-align: center; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 15px;'>
                        <h2 style='color: #27ae60; font-style: italic;'>¡Tu pedido está listo!</h2>
                        {saludoYDireccion}
                        <div style='background-color: #e8f8f5; padding: 15px; border-radius: 10px; margin: 20px 0;'>
                            <p style='margin: 0; font-weight: bold; font-size: 16px; color: #1e8449;'>{mensajeEntrega}</p>
                        </div>
                        <p style='color: #777; font-size: 14px;'>¡Que aproveche y gracias por confiar en Arrozeo!</p>
                    </div>";
            }
            else
            {
                return;
            }

            emailMessage.Subject = asunto;
            var bodyBuilder = new BodyBuilder { HtmlBody = cuerpoHtml };
            emailMessage.Body = bodyBuilder.ToMessageBody();

            // ⚙️ LÓGICA: El bloque 'using' asegura que, una vez termine de enviarse el correo,
            // la conexión con los servidores de Gmail se cierra y se destruye para liberar memoria.
            using (var client = new SmtpClient())
            {
                try
                {
                    await client.ConnectAsync(
                        _config["EmailConfig:SmtpServer"],
                        int.Parse(_config["EmailConfig:Port"] ?? "587"),
                        MailKit.Security.SecureSocketOptions.StartTls
                    );

                    var user = _config["EmailConfig:Username"] ?? "";
                    var pass = _config["EmailConfig:Password"] ?? "";

                    await client.AuthenticateAsync(user, pass);
                    await client.SendAsync(emailMessage);
                    await client.DisconnectAsync(true);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error al enviar email: {ex.Message}");
                }
            }
        }
    }
}

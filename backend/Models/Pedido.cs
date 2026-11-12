// ARCHIVO: Models/Pedido.cs
namespace BackendApi.Models
{
    // 🎓 NOTA PARA EL TFG: "Para la estructura del Pedido, opté por un modelo 'Desnormalizado' o plano.
    // En lugar de crear complejas tablas intermedias relacionales (ej: Pedido_Postre, Pedido_Cliente),
    // guardo toda la información en un solo registro. Esto mejora drásticamente la velocidad de lectura
    // y simplifica la estructura para un negocio de hostelería pequeño que no requiere historiales cruzados hipercomplejos."
    public class Pedido
    {
        // Identificador único del pedido en la base de datos
        public int Id { get; set; }

        // 1. Datos del Cliente
        public string NombreCliente { get; set; } = string.Empty;
        public string TelefonoCliente { get; set; } = string.Empty;

        // ✨ NUEVO: Campo para enviar notificaciones automáticas
        public string Email { get; set; } = string.Empty;

        public string Direccion { get; set; } = string.Empty;

        // 2. Datos del Producto
        public string NombreArroz { get; set; } = string.Empty;
        public int Raciones { get; set; }
        public bool Socarrat { get; set; }
        public decimal PrecioPersona { get; set; }
        public decimal PrecioTotal { get; set; }

        // 3. Datos de Logística y Pago
        public string MetodoEntrega { get; set; } = string.Empty;
        public string Fecha { get; set; } = string.Empty;
        public string Hora { get; set; } = string.Empty;
        public string MetodoPago { get; set; } = string.Empty;

        // 4. Notas adicionales para Raúl
        public string Comentarios { get; set; } = string.Empty;

        // 5. Postres
        public int RacionesTartaQueso { get; set; }
        public int RacionesFlanHuevo { get; set; }

        // 6. Estado del Pedido
        // ⚙️ LÓGICA: Aunque el estado podría ser un Enum (0=pendiente, 1=cocinando, 2=entregado),
        // usar strings planos hace que la comunicación con React y SignalR sea mucho más legible
        // a la hora de depurar errores viendo la red en el navegador.
        public string Estado { get; set; } = "pendiente";

        // 🎓 NOTA PARA EL TFG: "Almacenamos explícitamente el consentimiento del usuario (RGPD).
        // En caso de auditoría de la AEPD (Agencia Española de Protección de Datos),
        // este campo booleano demuestra que el usuario marcó la casilla antes de enviar sus datos."
        public bool AceptaPrivacidad { get; set; }
    }
}

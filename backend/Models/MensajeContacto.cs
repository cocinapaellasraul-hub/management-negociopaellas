// ARCHIVO: Models/MensajeContacto.cs
namespace BackendApi.Models
{
    // 🎓 NOTA PARA EL TFG: "Esta clase define el esquema de la tabla de contactos en PostgreSQL.
    // Al usar la propiedad llamada exactamente 'Id', Entity Framework Core la detecta por convención
    // y la configura automáticamente como la Clave Primaria (Primary Key) autoincremental en la base de datos."
    public class MensajeContacto
    {
        public int Id { get; set; }

        // ⚙️ LÓGICA: En las versiones modernas de C#, el compilador es muy estricto con los valores nulos (null).
        // Inicializar con '= string.Empty;' garantiza que si un dato llega vacío, no rompa el programa
        // con la temida 'NullReferenceException', sino que guarde un texto en blanco inofensivo.
        public string Nombre { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string Mensaje { get; set; } = string.Empty;

        // 🎓 NOTA PARA EL TFG: "He utilizado DateTime.UtcNow en lugar de DateTime.Now.
        // Es una buena práctica en desarrollo Backend guardar siempre las fechas en formato UTC (Tiempo Universal Coordinado)
        // para evitar bugs si el servidor físico se encuentra en una zona horaria distinta a la de España."
        public DateTime FechaEnvio { get; set; } = DateTime.UtcNow;

        // ✨ CAMBIO: Quitamos 'Leido' y ponemos 'Estado' para alinear el backend con React
        // ⚙️ LÓGICA: Al poner '= "pendientes"', si no le enviamos nada desde React,
        // C# le asigna este valor por defecto automáticamente antes de guardar.
        public string Estado { get; set; } = "pendientes";

        // 🎓 NOTA PARA EL TFG: "Registro legal obligatorio para el cumplimiento del RGPD."
        public bool AceptaPrivacidad { get; set; }
    }
}

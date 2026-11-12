// ARCHIVO: Models/Paella.cs
namespace BackendApi.Models
{
    public class Paella
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;

        // 🎓 NOTA PARA EL TFG: "Para los precios he utilizado el tipo de dato 'decimal' en lugar de 'float' o 'double'.
        // En C#, 'decimal' tiene mayor precisión y evita los famosos errores de redondeo de coma flotante,
        // por lo que es el estándar obligatorio para cualquier cálculo económico o monetario."
        public decimal PrecioPersona { get; set; }

        public string Categoria { get; set; } = string.Empty; // Ideal para separar "Arroces" de "Postres"
        public string ImagenUrl { get; set; } = string.Empty;

        // 🎓 NOTA PARA EL TFG: "La propiedad 'Activo' implementa el patrón 'Soft Delete' (Borrado Lógico).
        // En lugar de borrar un plato y arriesgarnos a romper el historial de pedidos antiguos que lo referencian,
        // simplemente lo marcamos como Activo = false para ocultarlo del menú público, manteniendo la integridad referencial."
        public bool Activo { get; set; } = true;
    }
}

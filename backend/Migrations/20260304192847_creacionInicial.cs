using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class creacionInicial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Paellas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "text", nullable: false),
                    Descripcion = table.Column<string>(type: "text", nullable: false),
                    Precio = table.Column<decimal>(type: "numeric", nullable: false),
                    Categoria = table.Column<string>(type: "text", nullable: false),
                    ImagenUrl = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Paellas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Pedido",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    NombreCliente = table.Column<string>(type: "text", nullable: false),
                    TelefonoCliente = table.Column<string>(type: "text", nullable: false),
                    NombreArroz = table.Column<string>(type: "text", nullable: false),
                    Raciones = table.Column<int>(type: "integer", nullable: false),
                    Socarrat = table.Column<bool>(type: "boolean", nullable: false),
                    PrecioPersona = table.Column<decimal>(type: "numeric", nullable: false),
                    PrecioTotal = table.Column<decimal>(type: "numeric", nullable: false),
                    MetodoEntrega = table.Column<string>(type: "text", nullable: false),
                    Fecha = table.Column<string>(type: "text", nullable: false),
                    Hora = table.Column<string>(type: "text", nullable: false),
                    MetodoPago = table.Column<string>(type: "text", nullable: false),
                    Comentarios = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pedido", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Paellas");

            migrationBuilder.DropTable(
                name: "Pedido");
        }
    }
}

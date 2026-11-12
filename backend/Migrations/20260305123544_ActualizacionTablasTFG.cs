using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class ActualizacionTablasTFG : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_Pedido",
                table: "Pedido");

            migrationBuilder.RenameTable(
                name: "Pedido",
                newName: "Pedidos");

            migrationBuilder.RenameColumn(
                name: "Precio",
                table: "Paellas",
                newName: "PrecioPersona");

            migrationBuilder.AddColumn<bool>(
                name: "Activo",
                table: "Paellas",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Pedidos",
                table: "Pedidos",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "MensajesContacto",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "text", nullable: false),
                    Telefono = table.Column<string>(type: "text", nullable: false),
                    Mensaje = table.Column<string>(type: "text", nullable: false),
                    FechaEnvio = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Leido = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MensajesContacto", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MensajesContacto");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Pedidos",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "Activo",
                table: "Paellas");

            migrationBuilder.RenameTable(
                name: "Pedidos",
                newName: "Pedido");

            migrationBuilder.RenameColumn(
                name: "PrecioPersona",
                table: "Paellas",
                newName: "Precio");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Pedido",
                table: "Pedido",
                column: "Id");
        }
    }
}

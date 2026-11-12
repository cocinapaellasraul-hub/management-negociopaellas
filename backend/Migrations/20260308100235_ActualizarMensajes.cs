using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class ActualizarMensajes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Leido",
                table: "MensajesContacto");

            migrationBuilder.AddColumn<string>(
                name: "Estado",
                table: "MensajesContacto",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Estado",
                table: "MensajesContacto");

            migrationBuilder.AddColumn<bool>(
                name: "Leido",
                table: "MensajesContacto",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}

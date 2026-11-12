// ARCHIVO: Controllers/AuthController.cs
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace BackendApi.Controllers
{
    // 🎓 NOTA PARA EL TFG: "La ruta de este controlador se auto-genera gracias a [controller].
    // Como la clase se llama AuthController, la ruta final será /api/Auth"
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _config;

        // ⚙️ LÓGICA: Inyección de Dependencias. Le pedimos a C# que nos traiga el archivo
        // appsettings.json (IConfiguration) para poder leer las contraseñas sin escribirlas en el código.
        public AuthController(IConfiguration config)
        {
            _config = config;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto request)
        {
            var adminPassword = _config["AdminConfig:Password"];

            // Verificamos si la contraseña enviada desde React coincide con el appsettings
            if (request.Password == adminPassword)
            {
                var jwtKey = _config["Jwt:Key"] ?? "ClaveDeRespaldoPorSiFallaElAppSettings2026";
                var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
                var credentials = new SigningCredentials(
                    securityKey,
                    SecurityAlgorithms.HmacSha256
                );

                // ⚙️ LÓGICA: Los "Claims" son como los sellos que le pones al pase VIP.
                // Dicen "Quién es" y "Qué permisos tiene".
                var claims = new[]
                {
                    new Claim(JwtRegisteredClaimNames.Sub, "AdminRaul"),
                    new Claim(ClaimTypes.Role, "Administrador"),
                };

                // Creamos el token válido por 12 horas
                var token = new JwtSecurityToken(
                    issuer: _config["Jwt:Issuer"],
                    audience: _config["Jwt:Audience"],
                    claims: claims,
                    expires: DateTime.Now.AddHours(12),
                    signingCredentials: credentials
                );

                return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token) });
            }

            // ⚙️ LÓGICA: Si falla, devolvemos un código HTTP 401 (Unauthorized) y React mostrará el error rojo.
            return Unauthorized(new { message = "Contraseña incorrecta" });
        }
    }

    // 🎓 NOTA PARA EL TFG: "Uso el patrón DTO (Data Transfer Object).
    // Esta clase pequeñita solo sirve para 'recoger' la contraseña que manda React de forma ordenada,
    // sin mezclarla con modelos de base de datos grandes."
    public class LoginDto
    {
        public string Password { get; set; } = string.Empty;
    }
}

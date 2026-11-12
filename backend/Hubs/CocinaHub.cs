// ARCHIVO: Hubs/CocinaHub.cs
using Microsoft.AspNetCore.SignalR;

namespace BackendApi.Hubs
{
    // 🎓 NOTA PARA EL TFG: "La integración de comunicaciones en tiempo real se realizó mediante Microsoft SignalR, 
    // que abstrae la complejidad del protocolo WebSockets (y hace 'fallback' a Server-Sent Events o Long Polling si el navegador es antiguo)."
    
    // Esta clase es el "altavoz" del servidor.
    // Cualquier cliente web que se conecte a este Hub escuchará los avisos.
    public class CocinaHub : Hub
    {
        // 🎓 NOTA PARA EL TFG: "Que esta clase esté vacía es una decisión arquitectónica intencionada. 
        // Mi sistema utiliza un modelo de 'Push Unidireccional'. 
        // En lugar de que el cliente de React envíe comandos a través de WebSockets (lo cual complicaría la seguridad), 
        // el cliente envía los datos por la API REST normal (que está protegida por JWT). Una vez guardados en base de datos, 
        // es el Servidor quien usa este Hub externamente (vía IHubContext) para empujar la actualización a la interfaz."
        
        // No necesitamos métodos complejos aquí dentro por ahora,
        // solo con que exista, el controlador podrá usarlo para "gritar" mensajes.
        
        // ⚙️ LÓGICA: Solo con heredar de la clase base `Hub`, el motor de .NET ya sabe que 
        // tiene que abrir el puerto y mantener los "túneles" de conexión abiertos con todos 
        // los navegadores que se conecten a la ruta `/cocinahub` definida en el Program.cs.
    }
}
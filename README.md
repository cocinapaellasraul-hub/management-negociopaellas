# Sistema de Gestión de Pedidos y Panel KDS (FoodTech) 🥘

Plataforma integral desarrollada como Trabajo de Fin de Grado (Ingeniería Informática) para digitalizar y automatizar el flujo de pedidos de un negocio local de hostelería, conectando la experiencia del cliente con la operativa real en cocina.

## 🚀 Tecnologías Utilizadas
* **Backend:** .NET 8, C#, WebSockets (SignalR) para tiempo real.
* **Frontend:** Astro, React, Tailwind CSS.
* **Base de Datos:** PostgreSQL (Neon.tech), Entity Framework Core (LINQ).
* **Arquitectura:** Inyección de dependencias, notificaciones push al panel de cocina y prevención de inyección SQL.

## ⚙️ Funcionalidades Principales
1. **Panel de Cocina (KDS) en Tiempo Real:** Recepción instantánea de comandas sin recargar la página gracias a SignalR.
2. **Gestión de Pedidos y Escandallos:** Flujo completo desde la selección del cliente hasta la entrega.
3. **Panel de Administración:** Control seguro para los gestores del restaurante.

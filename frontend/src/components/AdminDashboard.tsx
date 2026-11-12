// ARCHIVO: src/components/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

export default function AdminDashboard() {
    // ⚙️ LÓGICA: useState guarda datos en la memoria temporal del navegador. 
    // Si la página se recarga, esto vuelve a su valor inicial. 
    // Se usa para cosas que cambian en la pantalla, como saber si estás logueado.
    // --- SEGURIDAD JWT ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // --- DATOS ---
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [mensajes, setMensajes] = useState<any[]>([]);
    const [carta, setCarta] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    
    // --- ESTADOS EDICIÓN CARTA ---
    const [editandoId, setEditandoId] = useState<number | null>(null);
    const [tempPlato, setTempPlato] = useState<any>(null);
    
    // --- NUEVOS ESTADOS PARA AÑADIR PLATO ---
    const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
    const [nuevoPlato, setNuevoPlato] = useState({
        nombre: '',
        precioPersona: 0,
        descripcion: '',
        categoria: 'Principal', 
        imagenUrl: ''
    });

    // --- NAVEGACIÓN Y FILTROS ---
    const [pestanaActiva, setPestanaActiva] = useState<'pedidos' | 'mensajes' | 'carta'>('pedidos');
    const [filtroFlujo, setFiltroFlujo] = useState<'pendiente' | 'cocinando' | 'entregado'>('pendiente');
    const [filtroMensajes, setFiltroMensajes] = useState<'pendientes' | 'contestados'>('pendientes');

    // 👇 URL DEL BACKEND 👇
    const backendUrl = 'http://localhost:5086'; 

    // 🎓 NOTA PARA EL TFG: "He utilizado sessionStorage en lugar de localStorage para el JWT 
    // por seguridad. Así, si el administrador cierra la pestaña, la sesión se destruye automáticamente."
    // --- FUNCIONES DE AYUDA PARA JWT ---
    const getToken = () => sessionStorage.getItem('admin_jwt');
    
    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}` 
    });

    const handleLogout = () => {
        sessionStorage.removeItem('admin_jwt');
        setIsAuthenticated(false);
    };

    // ⚙️ LÓGICA: useEffect con [] (array vacío) significa "Ejecuta esto SOLO UNA VEZ cuando la página cargue".
    // Aquí comprueba de golpe si ya tienes la "llave" guardada para no pedirte la contraseña otra vez.
    // --- EFECTO INICIAL (Comprobar sesión) ---
    useEffect(() => {
        const token = getToken();
        if (token) {
            setIsAuthenticated(true);
            cargarDatos();
        } else {
            setCargando(false);
        }
    }, []);

    // 🎓 NOTA PARA EL TFG: "La reactividad en tiempo real se logra con SignalR (WebSockets). 
    // Este useEffect establece la conexión y se queda 'escuchando'. Cuando el servidor emite 'NuevoPedido', 
    // actualizo el estado de React añadiendo la comanda al principio de la lista sin tener que recargar."
    // --- EFECTO SIGNALR (Tiempo real) ---
    useEffect(() => {
        if (!isAuthenticated) return;

        const connection = new HubConnectionBuilder()
            .withUrl(`${backendUrl}/cocinahub`)
            .configureLogging(LogLevel.Information)
            .build();

        connection.start()
            .then(() => {
                connection.on("NuevoPedido", (nuevoPedido) => {
                    const pPersona = nuevoPedido.precioPersona ?? nuevoPedido.PrecioPersona ?? 0;
                    const raciones = nuevoPedido.raciones ?? nuevoPedido.Raciones ?? 0;
                    const tartas = nuevoPedido.racionesTartaQueso ?? nuevoPedido.RacionesTartaQueso ?? 0;
                    const flanes = nuevoPedido.racionesFlanHuevo ?? nuevoPedido.RacionesFlanHuevo ?? 0;
                    const envio = (nuevoPedido.metodoEntrega ?? nuevoPedido.MetodoEntrega ?? nuevoPedido.metodo ?? '').toLowerCase().includes('domicilio') ? 5 : 0;
                    const calculoRespaldo = (pPersona * raciones) + (tartas * 4) + (flanes * 4) + envio;
                    const precioBD = Number(nuevoPedido.precioTotal ?? nuevoPedido.PrecioTotal ?? nuevoPedido.precioTotalCalculado ?? 0);

                    const pedidoFormateado = { 
                        ...nuevoPedido, 
                        id: nuevoPedido.id ?? nuevoPedido.Id, 
                        estado: (nuevoPedido.estado ?? nuevoPedido.Estado ?? 'pendiente').toLowerCase().trim(),
                        precioFinal: precioBD > 0 ? precioBD : calculoRespaldo,
                        metodoPagoReal: nuevoPedido.metodoPago ?? nuevoPedido.MetodoPago ?? 'Efectivo'
                    };

                    setPedidos(prevPedidos => [pedidoFormateado, ...prevPedidos]);
                    alert(`🔔 ¡NUEVA COMANDA!\nAcaban de pedir ${pedidoFormateado.raciones}x ${pedidoFormateado.nombreArroz}`);
                });

                connection.on("NuevoMensaje", (nuevoMensaje) => {
                    const mensajeFormateado = { 
                        ...nuevoMensaje, 
                        id: nuevoMensaje.id ?? nuevoMensaje.Id, 
                        estado: (nuevoMensaje.estado ?? nuevoMensaje.Estado ?? 'pendientes').toLowerCase().trim() 
                    };

                    setMensajes(prevMensajes => [mensajeFormateado, ...prevMensajes]);
                    alert(`✉️ ¡NUEVO MENSAJE!\n${mensajeFormateado.nombre} acaba de escribirte.`);
                });
            })
            .catch(err => console.error("🔴 Error SignalR: ", err));

        // IMPORTANTE: Esto limpia el túnel si cierras el panel, para no dejar conexiones "fantasma" en el servidor.
        return () => { connection.stop(); };
    }, [isAuthenticated, backendUrl]);


    // --- LOGIN ---
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault(); // Evita que el formulario recargue toda la página web (comportamiento antiguo)
        setIsLoggingIn(true);
        setLoginError('');

        try {
            const res = await fetch(`${backendUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: password })
            });

            if (res.ok) {
                const data = await res.json();
                sessionStorage.setItem('admin_jwt', data.token); // Guardamos la "llave" que nos da C#
                setIsAuthenticated(true);
                cargarDatos();
            } else {
                setLoginError("Clave incorrecta");
                setPassword('');
            }
        } catch (err) {
            setLoginError("Error de conexión");
        } finally {
            setIsLoggingIn(false);
        }
    };

    // 🎓 NOTA PARA EL TFG: "Uso Promise.all para hacer peticiones en paralelo. 
    // En lugar de esperar a que carguen los pedidos para empezar a descargar los mensajes, 
    // descargo Pedidos, Mensajes y Carta al mismo tiempo, dividiendo el tiempo de carga entre 3."
    // --- CARGA DE DATOS ---
    const cargarDatos = async () => {
        setCargando(true);
        try {
            const [resP, resM, resC] = await Promise.all([
                fetch(`${backendUrl}/api/pedidos`, { headers: getAuthHeaders() }).catch(() => null),
                fetch(`${backendUrl}/api/contacto`, { headers: getAuthHeaders() }).catch(() => null),
                fetch(`${backendUrl}/api/carta`).catch(() => null) 
            ]);
            
            // Si el token ha caducado, C# devuelve un 401. Expulsamos al usuario por seguridad.
            if (resP?.status === 401 || resM?.status === 401) {
                handleLogout();
                return;
            }
            
            if (resP && resP.ok) {
                const dataP = await resP.json();
                setPedidos(dataP.map((p: any) => {
                    const pPersona = p.precioPersona ?? p.PrecioPersona ?? 0;
                    const raciones = p.raciones ?? p.Raciones ?? 0;
                    const tartas = p.racionesTartaQueso ?? p.RacionesTartaQueso ?? 0;
                    const flanes = p.racionesFlanHuevo ?? p.RacionesFlanHuevo ?? 0;
                    const envio = (p.metodoEntrega ?? p.MetodoEntrega ?? p.metodo ?? '').toLowerCase().includes('domicilio') ? 5 : 0;
                    const calculoRespaldo = (pPersona * raciones) + (tartas * 4) + (flanes * 4) + envio;
                    const precioBD = Number(p.precioTotal ?? p.PrecioTotal ?? p.precioTotalCalculado ?? 0);

                    return { 
                        ...p, 
                        id: p.id ?? p.Id, 
                        estado: (p.estado ?? p.Estado ?? 'pendiente').toLowerCase().trim(),
                        precioFinal: precioBD > 0 ? precioBD : calculoRespaldo,
                        metodoPagoReal: p.metodoPago ?? p.MetodoPago ?? 'Efectivo'
                    };
                }));
            }
            
            if (resM && resM.ok) {
                const dataM = await resM.json();
                setMensajes(dataM.map((m: any) => ({ 
                    ...m, 
                    id: m.id ?? m.Id, 
                    estado: (m.estado ?? m.Estado ?? 'pendientes').toLowerCase().trim() 
                })));
            }
            
            if (resC && resC.ok) {
                const dataC = await resC.json();
                setCarta(dataC.map((item: any) => ({
                    ...item,
                    id: item.id ?? item.Id,
                    nombre: item.nombre ?? item.Nombre,
                    precioPersona: item.precioPersona ?? item.PrecioPersona,
                    descripcion: item.descripcion ?? item.Descripcion,
                    categoria: (item.categoria ?? item.Categoria ?? 'principal').toLowerCase(),
                    imagenUrl: item.imagenUrl ?? item.ImagenUrl ?? ''
                })));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCargando(false);
        }
    };

    // ⚙️ LÓGICA: Descargar archivos desde una API protegida no es tan fácil como poner un <a> link.
    // Hay que traer el PDF como datos crudos (blob), crear una URL fantasma en el navegador, 
    // hacer clic virtualmente y luego destruirla. Es un truco muy profesional.
    // ✨ NUEVO: FUNCIÓN DESCARGAR PDF
    const descargarTicket = async (id: number) => {
        try {
            const res = await fetch(`${backendUrl}/api/ticket/${id}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Ticket_${id.toString().padStart(4, '0')}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } else {
                alert("Error al generar el ticket PDF.");
            }
        } catch (error) {
            console.error("Error descargando ticket", error);
            alert("Error de red al intentar descargar.");
        }
    };

    // --- ACCIONES COMANDAS ---
    const avanzarEstadoPedido = async (id: number, estadoActual: string) => {
        let siguienteEstado = 'pendiente';
        if (estadoActual === 'pendiente') siguienteEstado = 'cocinando';
        else if (estadoActual === 'cocinando') siguienteEstado = 'entregado';

        // 🎓 NOTA PARA EL TFG: "Optimistic UI Update: Actualizo el estado en la pantalla del usuario 
        // ANTES de que el servidor responda. Esto hace que la web se sienta ultra-rápida. 
        // Si luego el servidor da error en el catch, simplemente vuelvo a recargar los datos reales."
        setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado: siguienteEstado } : p));

        try {
            await fetch(`${backendUrl}/api/pedidos/${id}/estado`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ Estado: siguienteEstado }) 
            });
        } catch (error) {
            await cargarDatos(); 
        }
    };

    const eliminarPedido = async (id: number) => {
        if (!window.confirm("¿Borrar esta comanda permanentemente?")) return;
        try {
            const res = await fetch(`${backendUrl}/api/pedidos/${id}`, { 
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                setPedidos(prev => prev.filter(p => p.id !== id));
            }
        } catch (err) {
            console.error(err);
        }
    };

    // --- OTRAS FUNCIONES (Mensajes y Carta) ---
    const cambiarEstadoMensaje = async (id: number, nuevoEstado: 'pendientes' | 'contestados') => {
        setMensajes(prev => prev.map(m => m.id === id ? { ...m, estado: nuevoEstado } : m));
        try {
            await fetch(`${backendUrl}/api/contacto/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ Estado: nuevoEstado })
            });
        } catch (error) { await cargarDatos(); }
    };

    const iniciarEdicion = (plato: any) => { setEditandoId(plato.id); setTempPlato({ ...plato }); };
    const cancelarEdicion = () => { setEditandoId(null); setTempPlato(null); };

    const guardarCambiosCarta = async () => {
        if (!tempPlato || !tempPlato.id) return;
        try {
            const res = await fetch(`${backendUrl}/api/carta/${tempPlato.id}`, {
                method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(tempPlato)
            });
            if (res.ok) { await cargarDatos(); setEditandoId(null); setTempPlato(null); }
        } catch (err) { console.error(err); }
    };

    const eliminarPlato = async (id: number) => {
        if (!window.confirm("¿Estás seguro?")) return;
        try {
            const res = await fetch(`${backendUrl}/api/carta/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            if (res.ok) await cargarDatos(); 
        } catch (err) { console.error(err); }
    };

    const agregarPlato = async () => {
        try {
            const res = await fetch(`${backendUrl}/api/carta`, {
                method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(nuevoPlato)
            });
            if (res.ok) {
                await cargarDatos(); 
                setMostrarModalNuevo(false);
                setNuevoPlato({ nombre: '', precioPersona: 0, descripcion: '', categoria: 'Principal', imagenUrl: '' });
            }
        } catch (err) { console.error(err); }
    };

    const formatearFecha = (fechaStr: string) => {
        if (!fechaStr) return 'S/F';
        const date = new Date(fechaStr);
        return isNaN(date.getTime()) ? 'S/F' : date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const renderSeccionCarta = (titulo: string, categoriaFiltro: string) => {
        const platosFiltrados = carta.filter((item: any) => {
            const cat = item.categoria || 'principal'; 
            if (categoriaFiltro === 'Principal') return cat === 'principal' || cat === 'arroces' || cat === '';
            else if (categoriaFiltro === 'Postre') return cat === 'postre' || cat === 'postres';
            return false;
        });

        if (platosFiltrados.length === 0 && categoriaFiltro === 'Postre') return null;

        return (
            <div className="mb-12">
                <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-xl md:text-2xl font-serif italic text-gray-900">{titulo}</h2>
                    <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2.5 py-1 rounded-full">{platosFiltrados.length}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {platosFiltrados.map((item) => (
                        <div key={item.id} className={`bg-white rounded-2xl p-6 shadow-sm border transition-all relative ${editandoId === item.id ? 'border-orange-500 ring-4 ring-orange-50' : 'border-gray-100 hover:border-gray-300 hover:shadow-md'}`}>
                            {editandoId === item.id ? (
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Nombre</label>
                                        <input type="text" value={tempPlato.nombre} onChange={(e) => setTempPlato({...tempPlato, nombre: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Precio / Persona (€)</label>
                                        <input type="number" step="0.01" value={tempPlato.precioPersona} onChange={(e) => setTempPlato({...tempPlato, precioPersona: parseFloat(e.target.value)})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-500 font-mono" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">URL Imagen</label>
                                        <input type="text" value={tempPlato.imagenUrl || ''} onChange={(e) => setTempPlato({...tempPlato, imagenUrl: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Descripción</label>
                                        <textarea value={tempPlato.descripcion} onChange={(e) => setTempPlato({...tempPlato, descripcion: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm h-24 resize-none outline-none focus:border-orange-500" />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button onClick={guardarCambiosCarta} className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest active:scale-95 transition-transform">Guardar</button>
                                        <button onClick={cancelarEdicion} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors">Cancelar</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 flex-shrink-0">
                                            <img src={item.imagenUrl || '/images/placeholder-plato.jpg'} className="w-full h-full object-cover" alt={item.nombre} />
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => iniciarEdicion(item)} className="p-3 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-xl transition-colors active:scale-95" title="Editar">✏️</button>
                                            <button onClick={() => eliminarPlato(item.id)} className="p-3 text-gray-400 hover:text-red-600 bg-gray-50 rounded-xl transition-colors active:scale-95" title="Eliminar">🗑️</button>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-lg mb-1 leading-tight">{item.nombre}</h3>
                                    <div className="text-orange-600 font-mono font-bold text-sm mb-3">{item.precioPersona.toFixed(2)} €</div>
                                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{item.descripcion}</p>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 font-sans selection:bg-orange-100">
                <div className="max-w-md w-full bg-white rounded-[2rem] shadow-xl p-8 md:p-10 border border-gray-100">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gray-900 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                            <span className="text-white text-2xl font-serif italic">RB</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Acceso a Cocina</h2>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-6">
                        {loginError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold text-center">{loginError}</div>}
                        <input type="password" placeholder="Clave Maestra" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-orange-500 text-center text-xl tracking-widest" />
                        <button type="submit" disabled={isLoggingIn} className="w-full bg-orange-500 text-white py-4 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-gray-900 active:scale-95">{isLoggingIn ? 'Verificando...' : 'Entrar'}</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            <header className="bg-white px-4 md:px-8 py-4 border-b border-gray-200 sticky top-0 z-40 flex justify-between items-center shadow-sm">
                <div>
                    <h1 className="text-xl md:text-3xl font-serif italic text-gray-900">Centro de Control</h1>
                    <p className="text-gray-500 text-[10px] md:text-xs uppercase tracking-widest mt-1 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Sesión Segura
                    </p>
                </div>
                <nav className="hidden md:flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                    <button onClick={() => setPestanaActiva('pedidos')} className={`px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${pestanaActiva === 'pedidos' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Comandas</button>
                    <button onClick={() => setPestanaActiva('mensajes')} className={`px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${pestanaActiva === 'mensajes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Mensajes</button>
                    <button onClick={() => setPestanaActiva('carta')} className={`px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${pestanaActiva === 'carta' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>La Carta</button>
                    <button onClick={handleLogout} className="ml-2 px-3 py-2 text-gray-400 hover:text-red-500" title="Salir">🚪</button>
                </nav>
            </header>

            <div className="max-w-7xl mx-auto p-4 md:p-8 mt-4">
                {cargando && <div className="text-center py-20 animate-pulse text-gray-400 text-sm font-bold uppercase tracking-widest">Sincronizando...</div>}

                {/* COMANDAS */}
                {!cargando && pestanaActiva === 'pedidos' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex overflow-x-auto pb-4 mb-2 gap-2 snap-x hide-scrollbar">
                            <button onClick={() => setFiltroFlujo('pendiente')} className={`flex-shrink-0 snap-start px-5 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-wider border-2 transition-all ${filtroFlujo === 'pendiente' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'}`}>Pendientes</button>
                            <button onClick={() => setFiltroFlujo('cocinando')} className={`flex-shrink-0 snap-start px-5 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-wider border-2 transition-all ${filtroFlujo === 'cocinando' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-500 border-gray-200'}`}>En Cocina</button>
                            <button onClick={() => setFiltroFlujo('entregado')} className={`flex-shrink-0 snap-start px-5 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-wider border-2 transition-all ${filtroFlujo === 'entregado' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-500 border-gray-200'}`}>Entregadas</button>
                        </div>

                        {pedidos.filter(p => p.estado === filtroFlujo).length === 0 ? (
                            <div className="bg-white border border-gray-200 rounded-[2rem] p-16 text-center text-gray-400 italic">No hay comandas aquí.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
                                {pedidos.filter(p => p.estado === filtroFlujo).map((p) => {
                                    const esDomicilio = (p.metodo || p.metodoEntrega || '').toLowerCase().includes('domicilio');
                                    return (
                                        <div key={p.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                                            <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                                                <div>
                                                    <div className="flex gap-2 mb-2">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md text-white ${esDomicilio ? 'bg-blue-500' : 'bg-orange-500'}`}>{esDomicilio ? 'Domicilio' : 'Recogida'}</span>
                                                        <span className="text-[10px] text-gray-400 font-mono mt-0.5">#{p.id?.toString().padStart(4, '0')}</span>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-gray-900 leading-tight">{p.nombreArroz}</h3>
                                                    <p className="text-sm text-gray-500 mt-1 font-medium">{p.raciones} raciones {p.socarrat ? '· 🔥 Socarrat' : ''}</p>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    <span className="text-3xl font-black text-gray-900 tracking-tighter">{p.hora}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">{p.fecha}</span>
                                                </div>
                                            </div>

                                            <div className="p-6 flex-grow">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">👤</div>
                                                    <div>
                                                        <p className="text-base font-bold text-gray-900">{p.nombreCliente}</p>
                                                        <p className="text-sm text-orange-500 font-mono font-bold">{p.telefonoCliente}</p>
                                                    </div>
                                                </div>
                                                
                                                {esDomicilio && p.direccion && (
                                                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-4">
                                                        <p className="text-[10px] uppercase font-bold text-blue-400 mb-1">Dirección:</p>
                                                        <p className="text-sm text-blue-900 font-medium">{p.direccion}</p>
                                                    </div>
                                                )}

                                                <div className="flex items-end justify-between pt-4 mt-2 border-t border-gray-100">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Pago: <span className="text-orange-500">{p.metodoPagoReal}</span></p>
                                                        <p className="text-2xl font-black text-gray-900">{p.precioFinal?.toFixed(2)}€</p>
                                                    </div>
                                                    
                                                    <div className="flex gap-2">
                                                        {/* ✨ BOTÓN PDF AÑADIDO AQUÍ ✨ */}
                                                        <button onClick={() => descargarTicket(p.id)} className="bg-gray-100 text-gray-600 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest active:scale-95 transition-transform hover:bg-gray-200 shadow-sm" title="Descargar Ticket PDF">
                                                            📄 PDF
                                                        </button>

                                                        {filtroFlujo === 'pendiente' && (
                                                            <button onClick={() => avanzarEstadoPedido(p.id, 'pendiente')} className="bg-gray-900 text-white px-5 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest active:scale-95 transition-transform shadow-sm">Cocinar →</button>
                                                        )}
                                                        {filtroFlujo === 'cocinando' && (
                                                            <button onClick={() => avanzarEstadoPedido(p.id, 'cocinando')} className="bg-green-500 text-white px-5 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest active:scale-95 transition-transform shadow-sm">Lista ✓</button>
                                                        )}
                                                        {filtroFlujo === 'entregado' && (
                                                            <button onClick={() => eliminarPedido(p.id)} className="bg-red-50 text-red-600 px-5 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest active:scale-95 transition-transform shadow-sm">Borrar</button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* MENSAJES Y CARTA */}
                {!cargando && pestanaActiva === 'mensajes' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* Pestaña mensajes: El código se mantiene igual al anterior, lo comprimo visualmente por claridad pero funciona idéntico */}
                        <div className="flex overflow-x-auto pb-4 mb-2 gap-2 snap-x hide-scrollbar">
                            <button onClick={() => setFiltroMensajes('pendientes')} className={`flex-shrink-0 snap-start px-5 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-wider border-2 transition-all ${filtroMensajes === 'pendientes' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'}`}>Inbox</button>
                            <button onClick={() => setFiltroMensajes('contestados')} className={`flex-shrink-0 snap-start px-5 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-wider border-2 transition-all ${filtroMensajes === 'contestados' ? 'bg-white text-gray-900 border-gray-300' : 'bg-white text-gray-500 border-gray-200'}`}>Archivado</button>
                        </div>
                        {mensajes.filter(m => m.estado === filtroMensajes).length === 0 ? (
                            <div className="bg-white border border-gray-200 rounded-[2rem] p-16 text-center text-gray-400 italic">No hay mensajes.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                {mensajes.filter(m => m.estado === filtroMensajes).map((m) => (
                                    <div key={m.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-200 p-6 flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xl">{m.nombre.charAt(0)}</div>
                                                <div><h3 className="text-base font-bold text-gray-900">{m.nombre}</h3><p className="text-xs text-orange-500 font-mono font-bold">{m.telefono}</p></div>
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">{formatearFecha(m.fechaEnvio)}</span>
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl p-5 mb-6 flex-grow border border-gray-100"><p className="text-sm text-gray-700 leading-relaxed italic">"{m.mensaje}"</p></div>
                                        <div className="flex justify-end pt-4 border-t border-gray-100">
                                            <button onClick={() => cambiarEstadoMensaje(m.id, filtroMensajes === 'pendientes' ? 'contestados' : 'pendientes')} className="px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest border border-gray-200 text-gray-700 active:scale-95">{filtroMensajes === 'pendientes' ? 'Resuelto ✓' : 'A Inbox ↺'}</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {!cargando && pestanaActiva === 'carta' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                            <p className="text-sm text-gray-500 ml-2 font-medium hidden md:block">Gestión del catálogo público</p>
                            <button onClick={() => setMostrarModalNuevo(true)} className="w-full md:w-auto bg-gray-900 text-white px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider active:scale-95 flex items-center justify-center gap-2">Añadir Plato</button>
                        </div>
                        {renderSeccionCarta("Platos Principales", "Principal")}
                        {renderSeccionCarta("Postres y Extras", "Postre")}

                        {/* Modal Nuevo Plato */}
                        {mostrarModalNuevo && (
                            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
                                <div className="bg-white rounded-t-[2rem] md:rounded-[2rem] p-6 md:p-8 w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom-full md:zoom-in-95 max-h-[90vh] overflow-y-auto">
                                    <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-900">Añadir Plato</h2><button onClick={() => setMostrarModalNuevo(false)} className="p-2 text-gray-400 bg-gray-50 rounded-full">✕</button></div>
                                    <div className="space-y-4">
                                        <div className="flex bg-gray-100 p-1 rounded-xl">
                                            <button onClick={() => setNuevoPlato({...nuevoPlato, categoria: 'Principal'})} className={`flex-1 py-3 rounded-lg text-[11px] font-bold uppercase transition-all ${nuevoPlato.categoria === 'Principal' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Principal</button>
                                            <button onClick={() => setNuevoPlato({...nuevoPlato, categoria: 'Postre'})} className={`flex-1 py-3 rounded-lg text-[11px] font-bold uppercase transition-all ${nuevoPlato.categoria === 'Postre' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Postre</button>
                                        </div>
                                        <input type="text" placeholder="Nombre" value={nuevoPlato.nombre} onChange={e => setNuevoPlato({...nuevoPlato, nombre: e.target.value})} className="w-full px-4 py-4 bg-gray-50 rounded-xl text-sm outline-none focus:border-orange-500" />
                                        <input type="number" step="0.01" placeholder="Precio Persona" onChange={e => setNuevoPlato({...nuevoPlato, precioPersona: parseFloat(e.target.value)})} className="w-full px-4 py-4 bg-gray-50 rounded-xl text-sm outline-none focus:border-orange-500 font-mono" />
                                        <input type="text" placeholder="URL Imagen" value={nuevoPlato.imagenUrl} onChange={e => setNuevoPlato({...nuevoPlato, imagenUrl: e.target.value})} className="w-full px-4 py-4 bg-gray-50 rounded-xl text-sm outline-none focus:border-orange-500" />
                                        <textarea placeholder="Descripción" value={nuevoPlato.descripcion} onChange={e => setNuevoPlato({...nuevoPlato, descripcion: e.target.value})} className="w-full px-4 py-4 bg-gray-50 rounded-xl text-sm h-24 outline-none focus:border-orange-500" />
                                        <button onClick={agregarPlato} className="w-full py-4 bg-gray-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest active:scale-95">Publicar Plato</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* BARRA INFERIOR MOBILE */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around p-2 pb-6 z-40">
                <button onClick={() => setPestanaActiva('pedidos')} className={`flex flex-col items-center gap-1 p-2 w-full transition-colors ${pestanaActiva === 'pedidos' ? 'text-orange-500' : 'text-gray-400'}`}><span className="text-[9px] font-bold uppercase tracking-widest">Cocina</span></button>
                <button onClick={() => setPestanaActiva('mensajes')} className={`flex flex-col items-center gap-1 p-2 w-full transition-colors ${pestanaActiva === 'mensajes' ? 'text-orange-500' : 'text-gray-400'}`}><span className="text-[9px] font-bold uppercase tracking-widest">Inbox</span></button>
                <button onClick={() => setPestanaActiva('carta')} className={`flex flex-col items-center gap-1 p-2 w-full transition-colors ${pestanaActiva === 'carta' ? 'text-orange-500' : 'text-gray-400'}`}><span className="text-[9px] font-bold uppercase tracking-widest">Menú</span></button>
                <button onClick={handleLogout} className="flex flex-col items-center gap-1 p-2 w-full text-gray-400 hover:text-red-500"><span className="text-[9px] font-bold uppercase tracking-widest">Salir</span></button>
            </nav>
        </div>
    );
}
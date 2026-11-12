// ARCHIVO: src/components/CheckoutForm.tsx
import React, { useState, useEffect } from 'react';

export default function CheckoutForm() {
    const [pedido, setPedido] = useState<any>(null);
    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');
    const [email, setEmail] = useState(''); 
    const [direccion, setDireccion] = useState(''); 
    const [metodoPago, setMetodoPago] = useState('Efectivo');
    
    // ✨ NUEVO ESTADO RGPD
    const [aceptaRGPD, setAceptaRGPD] = useState(false);
    
    // ⚙️ LÓGICA: `isSubmitting` sirve para bloquear el botón de "Confirmar" mientras
    // la petición viaja a C#. Evita que el cliente haga doble clic y cree dos paellas por error.
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pedidoCompletado, setPedidoCompletado] = useState(false);
    const [error, setError] = useState('');

    // 🎓 NOTA PARA EL TFG: "Al cargar este componente, leo los datos de la paella que el usuario
    // guardó en la página anterior (CustomizationForm) rescatándolos de la memoria local del navegador."
    useEffect(() => {
        const datosGuardados = localStorage.getItem('pedidoActual');
        if (datosGuardados) {
            setPedido(JSON.parse(datosGuardados));
        } else {
            setError('No se ha encontrado ningún pedido en curso.');
        }
    }, []);

    if (!pedido) {
        return (
            <div className="flex items-center justify-center py-32 px-6">
                <div className="text-center font-serif text-2xl italic text-gray-400 animate-pulse">
                    {error ? error : "Recuperando los datos de tu pedido..."}
                </div>
            </div>
        );
    }

    const precioArroz = (pedido.precioPersona || 0) * (pedido.raciones || 0);
    const precioTarta = (pedido.racionesTartaQueso || 0) * 4;
    const precioFlan = (pedido.racionesFlanHuevo || 0) * 4;
    const precioPostres = precioTarta + precioFlan;
    const suplementoEnvio = pedido.metodo === 'Domicilio' ? 5 : 0;
    const total = precioArroz + precioPostres + suplementoEnvio;

    // Función para que el usuario solo pueda escribir números en el teléfono
    const manejarCambioTelefono = (e: React.ChangeEvent<HTMLInputElement>) => {
        const soloNumeros = e.target.value.replace(/\D/g, '');
        setTelefono(soloNumeros);
    };

    const procesarPedido = async (e: React.FormEvent) => {
        if(e) e.preventDefault();
        setError('');

        // 🎓 NOTA PARA EL TFG: "Implementé validación 'Front-end' robusta. No dejo que la petición 
        // viaje al servidor C# si los datos están mal, ahorrando así tráfico y carga al servidor."
        // 1. Validación de campos vacíos
        if (!nombre.trim() || !telefono.trim() || !email.trim()) {
            setError('Por favor, rellena tu nombre, teléfono y email para poder contactarte.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // 2. Validación estricta del Teléfono (Debe tener 9 números exactos)
        if (telefono.length !== 9) {
            setError('El número de teléfono debe tener exactamente 9 dígitos.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // 3. Validación estricta del Email usando Expresiones Regulares (Regex)
        // ⚙️ LÓGICA: Esta Regex comprueba que haya algo, una '@', algo más, un '.' y algo al final.
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Por favor, introduce un correo electrónico válido (ejemplo: tu@correo.com).');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // 4. Validación de Dirección si es a domicilio
        if (pedido.metodo === 'Domicilio' && !direccion.trim()) {
            setError('Indica la dirección completa para el envío a domicilio.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // ✨ NUEVA VALIDACIÓN RGPD
        // 🎓 NOTA PARA EL TFG: "Bloqueo duro a nivel de Frontend. La Ley de Protección de Datos nos 
        // obliga a asegurar que el usuario ha marcado activamente el checkbox antes de enviar su información personal."
        if (!aceptaRGPD) {
            setError('Por imperativo legal (RGPD), debes aceptar la Política de Privacidad para poder tramitar el pedido.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setIsSubmitting(true);

        // ⚙️ LÓGICA: Este es el DTO (Data Transfer Object) del Frontend.
        // Lo construimos para que encaje EXACTAMENTE con las columnas que C# espera en su modelo Pedido.cs.
        const payload = {
            nombreCliente: nombre,
            telefonoCliente: `+34 ${telefono}`, 
            email: email.trim().toLowerCase(), 
            direccion: pedido.metodo === 'Domicilio' ? direccion : "Recogida Local",
            nombreArroz: pedido.nombreArroz || "Paella", 
            raciones: pedido.raciones,
            socarrat: pedido.socarrat,
            precioPersona: pedido.precioPersona,
            racionesTartaQueso: pedido.racionesTartaQueso || 0,
            racionesFlanHuevo: pedido.racionesFlanHuevo || 0,
            precioTotal: total, 
            metodoEntrega: pedido.metodo,
            fecha: pedido.fecha || new Date().toISOString().split('T')[0], 
            hora: pedido.hora || "Lo antes posible",
            metodoPago: metodoPago,
            comentarios: pedido.comentarios || "",
            estado: "pendiente",
            aceptaPrivacidad: aceptaRGPD // ✨ NUEVO: Enviamos el check a la base de datos
        };

        try {
            const backendUrl = 'http://localhost:5086/api/pedidos'; 
            
            // 🎓 NOTA PARA EL TFG: "La conexión con la API REST se hace mediante la API Fetch nativa de JS.
            // Uso async/await para no bloquear el hilo principal de la aplicación web."
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

          if (response.ok) {
                setPedidoCompletado(true);
                // ⚙️ LÓGICA: Limpiamos la memoria para que el carrito quede vacío para la próxima compra
                localStorage.clear(); 
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                // ✨ NUEVA LÓGICA: Leemos el cuerpo de la respuesta (JSON) que C# nos ha enviado
                // para extraer el mensaje de error exacto (ej. "Cupo máximo completado...").
                const errorData = await response.json();
                setError(errorData.error || `Error del servidor: ${response.status}. Inténtalo de nuevo.`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (error) {
            console.error(error);
            setError('Error de conexión. Asegúrate de que el servidor C# está encendido.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (pedidoCompletado) {
        return (
            <div className="py-16 px-4">
                <div className="max-w-xl mx-auto bg-white rounded-[3rem] p-10 shadow-xl text-center">
                    <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h2 className="font-serif text-4xl italic mb-4">¡Oído cocina!</h2>
                    <p className="text-gray-500 mb-8 font-medium">Gracias {nombre}, hemos recibido tu pedido.</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-8 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        Te avisaremos en <span className="text-orange-500">{email}</span> cuando esté lista
                    </p>
                    <button onClick={() => window.location.href = '/'} className="w-full bg-black text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-[11px]">Volver al inicio</button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-20">
            <div className="grid lg:grid-cols-12 gap-8">
                
                {/* DATOS CLIENTE */}
                <div className="lg:col-span-7 space-y-8 order-2 lg:order-1">
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100">
                        <h2 className="font-serif text-3xl italic mb-8">Tus Datos</h2>
                        
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 animate-bounce">
                                ⚠️ {error}
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nombre</label>
                                    <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre completo" className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 text-sm font-bold transition-all" />
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Teléfono</label>
                                    <div className="flex bg-gray-50 rounded-2xl focus-within:ring-2 focus-within:ring-orange-500 overflow-hidden transition-all border border-transparent">
                                        <span className="flex items-center justify-center px-4 bg-gray-100 text-gray-500 font-bold border-r border-gray-200 text-sm">
                                            +34
                                        </span>
                                        <input 
                                            type="tel" 
                                            inputMode="numeric" 
                                            maxLength={9} 
                                            value={telefono} 
                                            onChange={manejarCambioTelefono} 
                                            placeholder="600 000 000" 
                                            className="w-full p-4 bg-transparent border-none focus:ring-0 text-sm font-bold" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email (Para notificaciones)</label>
                                <input 
                                    type="email" 
                                    inputMode="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    placeholder="tu@correo.com" 
                                    className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 text-sm font-bold transition-all" 
                                />
                            </div>

                            {pedido.metodo === 'Domicilio' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-orange-500 ml-1">Dirección de Entrega</label>
                                    <textarea value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección completa..." className="w-full p-4 bg-orange-50/30 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 text-sm font-bold h-24 resize-none transition-all" />
                                </div>
                            )}

                            <div className="pt-6">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 block mb-4">Forma de Pago</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button type="button" onClick={() => setMetodoPago('Efectivo')} className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${metodoPago === 'Efectivo' ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-100'}`}>Efectivo</button>
                                    <button type="button" onClick={() => setMetodoPago('Bizum')} className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${metodoPago === 'Bizum' ? 'bg-[#00a4bd] text-white border-[#00a4bd]' : 'bg-white text-gray-400 border-gray-100'}`}>Bizum</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TICKET RESUMEN */}
                <div className="lg:col-span-5 order-1 lg:order-2">
                    <div className="bg-gray-900 rounded-[2.5rem] p-8 md:p-10 text-white sticky top-10 shadow-2xl">
                        <h3 className="font-serif text-2xl italic mb-8 border-b border-white/10 pb-6">Resumen del Pedido</h3>
                        
                        <div className="space-y-4 mb-10">
                            <div className="flex justify-between items-center font-bold">
                                <span className="text-gray-400 text-sm">{pedido.raciones}x {pedido.nombreArroz}</span>
                                <span>{precioArroz.toFixed(2)}€</span>
                            </div>
                            {precioPostres > 0 && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Postres caseros</span>
                                    <span className="font-bold">{precioPostres.toFixed(2)}€</span>
                                </div>
                            )}
                            {suplementoEnvio > 0 && (
                                <div className="flex justify-between items-center text-sm text-orange-400 font-bold">
                                    <span>Gastos envío</span>
                                    <span>+5.00€</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-end mb-10">
                            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-white/30">Total a pagar</span>
                            <span className="text-5xl font-black tracking-tighter text-orange-500">{total.toFixed(2)}€</span>
                        </div>

                        {/* ✨ CASILLA RGPD OBLIGATORIA (Con texto claro sobre fondo oscuro) */}
                        <div className="flex items-start gap-3 mb-6">
                            <div className="flex items-center h-5 mt-0.5">
                                <input 
                                    id="rgpd" 
                                    type="checkbox" 
                                    checked={aceptaRGPD}
                                    onChange={(e) => setAceptaRGPD(e.target.checked)}
                                    className="w-4 h-4 border-none rounded bg-white/10 checked:bg-[#E67E22] focus:ring-2 focus:ring-[#E67E22] transition-all cursor-pointer" 
                                />
                            </div>
                            <label htmlFor="rgpd" className="text-[10px] text-white/50 leading-relaxed cursor-pointer">
                                He leído y acepto la <a href="/politica-privacidad" target="_blank" className="text-[#E67E22] underline font-bold hover:text-white transition-colors">Política de Privacidad</a> y consiento el tratamiento de mis datos para la gestión de este pedido.*
                            </label>
                        </div>

                        <button 
                            type="button"
                            onClick={procesarPedido}
                            disabled={isSubmitting}
                            className={`w-full py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-lg shadow-orange-900/20 ${
                                isSubmitting ? 'bg-gray-700 animate-pulse cursor-not-allowed' : 'bg-[#E67E22] hover:bg-[#D35400] active:scale-95'
                            }`}
                        >
                            {isSubmitting ? 'Conectando con cocina...' : 'Confirmar Pedido'}
                        </button>
                        
                        <p className="text-[8px] text-center text-white/20 uppercase mt-6 tracking-widest">Al confirmar, Raúl recibirá un aviso inmediato</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
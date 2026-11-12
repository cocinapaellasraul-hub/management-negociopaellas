// ARCHIVO: src/components/ContactForm.tsx
import React, { useState } from 'react';

// 🎓 NOTA PARA EL TFG: "Este formulario usa el patrón de 'Componentes Controlados' de React.
// Esto significa que React es la 'fuente única de la verdad' para los datos que escribe el cliente, 
// lo que hace que sea muy fácil enviarlos al backend posteriormente."
export default function ContactForm() {
    // 1. Estados para almacenar lo que el usuario escribe
    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');
    const [mensaje, setMensaje] = useState('');
    
    // ✨ NUEVO ESTADO RGPD
    const [aceptaRGPD, setAceptaRGPD] = useState(false);
    
    // 2. Estados para controlar la interfaz (cargas y errores)
    const [enviado, setEnviado] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    const manejarEnvio = async (e: React.FormEvent) => {
        // ⚙️ LÓGICA: Fundamental. Evita que el navegador haga el submit nativo en HTML 
        // y nos permite gestionar la petición vía Fetch.
        e.preventDefault(); 

        // ✨ NUEVA VALIDACIÓN RGPD
        if (!aceptaRGPD) {
            setError('Debes aceptar la Política de Privacidad para poder enviar el mensaje.');
            return;
        }

        setCargando(true);
        setError('');

        // Construimos el JSON exactamente con los mismos nombres que tu clase en C#
        const payload = {
            nombre: nombre,
            telefono: telefono,
            mensaje: mensaje,
            aceptaPrivacidad: aceptaRGPD // ✨ NUEVO: Enviamos el check a C#
            // Nota: FechaEnvio y Leido se ponen automáticamente en tu backend
        };

        try {
            // IMPORTANTE: Asegúrate de que el puerto coincida con el de tu backend (suele ser 5000, 5262, 7000...)
            const respuesta = await fetch('http://localhost:5086/api/contacto', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (respuesta.ok) {
                setEnviado(true);
                // Vaciamos los campos por si quiere enviar otro
                setNombre('');
                setTelefono('');
                setMensaje('');
                setAceptaRGPD(false); // Reseteamos el checkbox
            } else {
                setError('Hubo un problema al enviar el mensaje. Por favor, inténtelo de nuevo.');
            }
        } catch (err) {
            setError('No se pudo conectar con el servidor. Compruebe que el backend está ejecutándose.');
        } finally {
            // ⚙️ LÓGICA: El bloque 'finally' se ejecuta SIEMPRE, haya ido bien o haya fallado.
            // Es el lugar perfecto para apagar el estado "Cargando..." y reactivar los botones.
            setCargando(false);
        }
    };

    if (enviado) {
        return (
            <div className="text-center py-10 animate-fade-in">
                <div className="text-[#E67E22] text-5xl mb-4">✓</div>
                <h3 className="font-serif text-2xl italic mb-2">¡Gracias por contactar!</h3>
                <p className="text-gray-500 text-sm">Raúl Bacete ha recibido su mensaje y le contactará pronto.</p>
                <button 
                    onClick={() => setEnviado(false)}
                    className="mt-6 text-[10px] uppercase tracking-widest font-black border-b border-[#E67E22] pb-1"
                >
                    Enviar otro mensaje
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={manejarEnvio} className="space-y-6">
            
            {/* Mensaje de error visual si falla la conexión */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-sm font-medium">
                    {error}
                </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-[#E67E22]">Nombre</label>
                    <input 
                        required
                        type="text" 
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Su nombre" 
                        className="w-full p-5 bg-gray-50 rounded-2xl border-none focus:ring-1 focus:ring-orange-200 transition-all text-sm" 
                        disabled={cargando}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-[#E67E22]">Teléfono</label>
                    <input 
                        required
                        type="tel" 
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="+34 600 000 000" 
                        className="w-full p-5 bg-gray-50 rounded-2xl border-none focus:ring-1 focus:ring-orange-200 transition-all text-sm" 
                        disabled={cargando}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-[#E67E22]">Mensaje</label>
                <textarea 
                    required
                    rows={4} 
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="¿En qué podemos ayudarle?" 
                    className="w-full p-5 bg-gray-50 rounded-2xl border-none focus:ring-1 focus:ring-orange-200 transition-all text-sm"
                    disabled={cargando}
                ></textarea>
            </div>
            
            {/* ✨ CASILLA RGPD OBLIGATORIA (Con texto oscuro sobre fondo claro) */}
            <div className="flex items-start gap-3 pt-2 mb-2">
                <div className="flex items-center h-5 mt-0.5">
                    <input 
                        id="rgpd_contacto" 
                        type="checkbox" 
                        checked={aceptaRGPD}
                        onChange={(e) => setAceptaRGPD(e.target.checked)}
                        className="w-4 h-4 border border-gray-300 rounded bg-white checked:bg-[#E67E22] checked:border-[#E67E22] focus:ring-2 focus:ring-[#E67E22] transition-all cursor-pointer" 
                    />
                </div>
                <label htmlFor="rgpd_contacto" className="text-[11px] text-gray-500 leading-relaxed cursor-pointer">
                    He leído y acepto la <a href="/politica-privacidad" target="_blank" className="text-[#E67E22] underline font-bold hover:text-[#1A1A1A] transition-colors">Política de Privacidad</a> y consiento el tratamiento de mis datos.*
                </label>
            </div>

            <button 
                type="submit" 
                disabled={cargando}
                className={`w-full text-white py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-500 shadow-xl shadow-orange-900/10 ${
                    cargando ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#1A1A1A] hover:bg-[#E67E22]'
                }`}
            >
                {cargando ? 'Enviando...' : 'Enviar Mensaje'}
            </button>
        </form>
    );
}
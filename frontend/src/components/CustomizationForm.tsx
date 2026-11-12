// ARCHIVO: src/components/CustomizationForm.tsx
import React, { useState, useEffect } from 'react';

export default function PersonalizarPedidoClient() {
    const [platoBase, setPlatoBase] = useState<any>(null);

    const [raciones, setRaciones] = useState(2);
    const [socarrat, setSocarrat] = useState(false);
    
    const [racionesTarta, setRacionesTarta] = useState(0);
    const [racionesFlan, setRacionesFlan] = useState(0);
    const precioPostre = 4.00;

    const [metodo, setMetodo] = useState('Recogida'); 
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [comentarios, setComentarios] = useState('');

    // ✨ NUEVO: Estados para manejar los errores visuales y restricciones
    const [errorFecha, setErrorFecha] = useState('');
    const [esVentanaPermitida, setEsVentanaPermitida] = useState(true);
    const [fechaMinima, setFechaMinima] = useState('');

    useEffect(() => {
        const guardado = localStorage.getItem('platoBase');
        if (guardado) {
            setPlatoBase(JSON.parse(guardado));
        }

        // ⚙️ LÓGICA 1: Comprobar si HOY es de Lunes a Jueves
        const hoy = new Date();
        const diaSemana = hoy.getDay(); // 0=Domingo, 1=Lunes... 5=Viernes, 6=Sábado
        
        // ⚠️ HACK TEMPORAL PARA EL TFG: Comentamos la restricción para que no bloquee la interfaz hoy
        /*
        if (diaSemana === 0 || diaSemana === 5 || diaSemana === 6) {
            setEsVentanaPermitida(false);
        }
        */

        // ⚙️ LÓGICA: Evitar que elijan fechas en el pasado
        const yyyy = hoy.getFullYear();
        const mm = String(hoy.getMonth() + 1).padStart(2, '0');
        const dd = String(hoy.getDate()).padStart(2, '0');
        setFechaMinima(`${yyyy}-${mm}-${dd}`);
    }, []);

    if (!platoBase) {
        return <div className="p-24 text-center font-serif text-2xl italic text-gray-500">Cargando tu selección...</div>;
    }

    // 🎓 NOTA PARA EL TFG: "Estos cálculos se hacen 'al vuelo' cada vez que el estado cambia.
    // React es tan eficiente que no necesito un botón de 'Actualizar precio', todo el panel lateral 
    // refleja los cálculos matemáticos instantáneamente."
    const precioArroz = platoBase.precioPersona * raciones;
    const totalExtras = (racionesTarta * precioPostre) + (racionesFlan * precioPostre);
    const suplementoEnvio = metodo === 'Domicilio' ? 5 : 0;
    const precioTotal = precioArroz + totalExtras + suplementoEnvio;

    // ✨ NUEVO: Validador en tiempo real del calendario
    const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateStr = e.target.value;
        setFecha(dateStr);
        setErrorFecha('');

        if (dateStr) {
            // Forzamos la interpretación local añadiendo la hora para evitar bugs de zona horaria
            const dateObj = new Date(dateStr + 'T00:00:00');
            const day = dateObj.getDay();
            
            // Si elige un día que NO es Viernes(5), Sábado(6) o Domingo(0)
            if (day !== 0 && day !== 5 && day !== 6) {
                setErrorFecha('⚠️ Los arroces se cocinan exclusivamente los fines de semana (viernes, sábado y domingo).');
            }
        }
    };

    const handleConfirmarPedido = () => {
        // ✨ NUEVO: Barreras de seguridad antes de navegar al checkout
        if (!esVentanaPermitida) {
            alert('❌ La recepción de pedidos en línea está cerrada. Las reservas solo están operativas de lunes a jueves.');
            return;
        }

        if (!fecha || !hora) {
            alert('⚠️ Por favor, selecciona un día y una hora de entrega.');
            return;
        }

        if (errorFecha) {
            alert('⚠️ Has seleccionado un día de entrega inválido. Por favor, corrígelo antes de continuar.');
            return;
        }

        const pedidoData = {
            nombreArroz: platoBase.nombreArroz,
            precioPersona: platoBase.precioPersona,
            raciones: raciones,
            socarrat: socarrat,
            racionesTartaQueso: racionesTarta,
            racionesFlanHuevo: racionesFlan,
            metodo: metodo,
            fecha: fecha,
            hora: hora,
            comentarios: comentarios,
            precioTotalCalculado: precioTotal
        };

        // ⚙️ LÓGICA: Pasamos el 'testigo' a la siguiente página. Guardamos el pedido configurado
        // en localStorage para que la página CheckoutForm pueda leerlo y enviarlo al backend.
        localStorage.setItem('pedidoActual', JSON.stringify(pedidoData));
        window.location.href = '/finalizar-pedido';
    };

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid lg:grid-cols-12 gap-8 md:gap-20 items-start pb-20">
            
            {/* COLUMNA IZQUIERDA: DISEÑO DEL CLIENTE */}
            <div className="lg:col-span-5 lg:sticky lg:top-32 order-1">
                <div className="w-full aspect-square bg-white border border-orange-100/20 overflow-hidden rounded-[2.5rem] shadow-sm">
                    {platoBase.imagen ? (
                        <img src={platoBase.imagen} alt={platoBase.nombreArroz} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gray-50 flex items-center justify-center text-[10px] uppercase tracking-widest text-gray-300 italic">Sin Imagen</div>
                    )}
                </div>
                <div className="mt-8 md:mt-12 px-2">
                    <h1 className="font-serif text-4xl md:text-6xl italic text-[#1A1A1A] leading-tight mb-4">{platoBase.nombreArroz}</h1>
                    <p className="text-gray-500 italic font-serif text-lg md:text-xl">{platoBase.descripcion}</p>
                </div>
            </div>

            {/* COLUMNA DERECHA: EL FORMULARIO */}
            <div className="lg:col-span-7 bg-white p-6 md:p-16 rounded-[2.5rem] md:rounded-[3rem] shadow-sm border border-orange-100/20 order-2">
                
                {/* ✨ NUEVO: Banner de aviso si entran a pedir de Viernes a Domingo */}
                {!esVentanaPermitida && (
                    <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl text-center shadow-sm">
                        <h3 className="text-lg font-bold text-red-800 mb-2">Recepción de Pedidos Cerrada</h3>
                        <p className="text-red-700 text-sm leading-relaxed">
                            Para garantizar la frescura de los ingredientes, las reservas en línea solo están operativas desde el <strong>lunes a las 00:00 hasta el jueves a las 23:59</strong>.
                        </p>
                    </div>
                )}

                <div className={`space-y-12 ${!esVentanaPermitida ? 'opacity-50 pointer-events-none' : ''}`}>
                    
                    {/* 01. RACIONES */}
                    <div className="space-y-6">
                        <label className="text-[10px] uppercase tracking-[0.3em] font-black text-[#E67E22] block">01. Seleccione raciones de Arroz</label>
                        <div className="flex items-center justify-between bg-[#F9F9F9] p-2 rounded-2xl w-full md:w-fit">
                            <button onClick={() => raciones > 2 && setRaciones(raciones - 1)} className="w-16 h-16 md:w-14 md:h-14 flex items-center justify-center bg-white rounded-xl shadow-sm text-2xl font-bold active:scale-90 transition-transform">-</button>
                            <span className="px-10 font-serif text-4xl italic min-w-[80px] text-center text-[#1A1A1A]">{raciones}</span>
                            <button onClick={() => raciones < 20 && setRaciones(raciones + 1)} className="w-16 h-16 md:w-14 md:h-14 flex items-center justify-center bg-[#E67E22] text-white rounded-xl shadow-sm text-2xl font-bold active:scale-90 transition-transform">+</button>
                        </div>
                    </div>

                    {/* 02. SOCARRAT */}
                    <div className="space-y-6">
                        <label className="text-[10px] uppercase tracking-[0.3em] font-black text-[#E67E22] block">02. ¿Añadir Socarrat?</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[true, false].map((val) => (
                                <button key={String(val)} onClick={() => setSocarrat(val)} className={`py-5 text-[10px] font-bold uppercase tracking-widest border-2 rounded-2xl transition-all ${socarrat === val ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'border-gray-100 text-gray-400 bg-white'}`}>
                                    {val ? 'Sí, tostado' : 'No, punto normal'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 03. EXTRAS */}
                    <div className="space-y-6 pt-8 border-t border-gray-100">
                        <label className="text-[10px] uppercase tracking-[0.3em] font-black text-[#E67E22] block">03. Extras Caseros (4.00€ / ud)</label>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between items-center bg-[#F9F9F9] p-5 rounded-2xl border border-gray-50">
                                <span className="font-bold text-sm text-[#1A1A1A]">Tarta de Queso Fluida</span>
                                <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
                                    <button onClick={() => racionesTarta > 0 && setRacionesTarta(racionesTarta - 1)} className="px-5 py-3 hover:bg-gray-50 font-bold active:bg-gray-100">-</button>
                                    <span className="px-4 font-bold text-sm min-w-[30px] text-center">{racionesTarta}</span>
                                    <button onClick={() => setRacionesTarta(racionesTarta + 1)} className="px-5 py-3 hover:bg-gray-50 font-bold active:bg-gray-100">+</button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-[#F9F9F9] p-5 rounded-2xl border border-gray-50">
                                <span className="font-bold text-sm text-[#1A1A1A]">Flan de Huevo Tradicional</span>
                                <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
                                    <button onClick={() => racionesFlan > 0 && setRacionesFlan(racionesFlan - 1)} className="px-5 py-3 hover:bg-gray-50 font-bold active:bg-gray-100">-</button>
                                    <span className="px-4 font-bold text-sm min-w-[30px] text-center">{racionesFlan}</span>
                                    <button onClick={() => setRacionesFlan(racionesFlan + 1)} className="px-5 py-3 hover:bg-gray-50 font-bold active:bg-gray-100">+</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 04. MÉTODO DE ENTREGA */}
                    <div className="space-y-6 pt-8 border-t border-gray-100">
                        <label className="text-[10px] uppercase tracking-[0.3em] font-black text-[#E67E22] block">04. Método de entrega</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button onClick={() => setMetodo('Recogida')} className={`p-6 border-2 rounded-2xl text-left transition-all ${metodo === 'Recogida' ? 'border-[#1A1A1A] bg-[#F9F9F9]' : 'border-gray-100 bg-white'}`}>
                                <p className="font-black text-[11px] uppercase tracking-widest text-[#1A1A1A]">Recogida Local</p>
                                <p className="text-[9px] text-gray-400 mt-2 uppercase font-bold tracking-tighter">Gratis en Moixent</p>
                            </button>
                            <button onClick={() => setMetodo('Domicilio')} className={`p-6 border-2 rounded-2xl text-left transition-all ${metodo === 'Domicilio' ? 'border-[#E67E22] bg-orange-50/30' : 'border-gray-100 bg-white'}`}>
                                <p className="font-black text-[11px] uppercase tracking-widest text-[#1A1A1A]">A Domicilio</p>
                                <p className="text-[9px] text-[#E67E22] mt-2 uppercase font-black">+ 5.00 € suplemento</p>
                            </button>
                        </div>
                    </div>

                    {/* 05. FECHA Y HORA */}
                    <div className="space-y-6 pt-8 border-t border-gray-100">
                        <label className="text-[10px] uppercase tracking-[0.3em] font-black text-[#E67E22] block">05. Fecha y Hora de entrega</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="relative">
                                <input 
                                    type="date" 
                                    min={fechaMinima}
                                    value={fecha}
                                    onChange={handleFechaChange}
                                    className={`w-full p-5 rounded-2xl text-xs font-bold uppercase tracking-widest border-2 outline-none transition-all appearance-none ${errorFecha ? 'border-red-400 bg-red-50 text-red-900 focus:border-red-500' : 'bg-[#F9F9F9] border-transparent focus:border-orange-200 focus:bg-white'}`} 
                                />
                            </div>
                            <div className="relative">
                                <select 
                                    value={hora}
                                    onChange={(e) => setHora(e.target.value)}
                                    className="w-full p-5 bg-[#F9F9F9] rounded-2xl text-xs font-bold uppercase tracking-widest border-2 border-transparent focus:border-orange-200 focus:bg-white transition-all outline-none appearance-none cursor-pointer"
                                >
                                    <option value="">Seleccionar hora</option>
                                    {['12:00', '13:00', '14:00', '15:00', '16:00'].map(h => <option key={h} value={h}>{h} h</option>)}
                                </select>
                            </div>
                        </div>
                        {/* ✨ NUEVO: Mensaje de error visual debajo del calendario */}
                        {errorFecha && (
                            <p className="mt-2 text-xs text-red-600 font-bold bg-red-50 p-3 rounded-lg border border-red-100">
                                {errorFecha}
                            </p>
                        )}
                    </div>

                    {/* 06. NOTAS */}
                    <div className="space-y-6">
                        <label className="text-[10px] uppercase tracking-[0.3em] font-black text-[#E67E22] block">06. Notas para el cocinero</label>
                        <textarea 
                            value={comentarios}
                            onChange={(e) => setComentarios(e.target.value)}
                            placeholder="Ej: Arroz al punto, alérgico a..." 
                            className="w-full p-6 bg-[#F9F9F9] rounded-[1.5rem] border-2 border-transparent focus:border-orange-100 focus:bg-white text-sm min-h-[120px] outline-none transition-all placeholder:text-gray-300"
                        ></textarea>
                    </div>

                    {/* RESUMEN DE PAGO */}
                    <div className="bg-[#1A1A1A] p-8 md:p-10 rounded-[2.5rem] text-white shadow-2xl shadow-gray-200">
                        <div className="space-y-3 mb-8">
                            <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.2em] font-bold">
                                <span className="text-white/50">{raciones} Raciones de Arroz</span>
                                <span>{precioArroz.toFixed(2)} €</span>
                            </div>
                            
                            {(racionesTarta > 0 || racionesFlan > 0) && (
                                <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.2em] font-bold">
                                    <span className="text-white/50">Postres Caseros</span>
                                    <span>{totalExtras.toFixed(2)} €</span>
                                </div>
                            )}

                            {metodo === 'Domicilio' && (
                                <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.2em] font-black text-[#E67E22]">
                                    <span>Gastos de envío</span>
                                    <span>+ 5.00 €</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-end pt-6 border-t border-white/10">
                            <div>
                                <span className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Total a pagar</span>
                                <span className="text-5xl font-black tracking-tighter tabular-nums">{precioTotal.toFixed(2)}<span className="text-2xl ml-1 text-[#E67E22]">€</span></span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleConfirmarPedido} 
                        disabled={!esVentanaPermitida}
                        className={`w-full text-white py-6 md:py-8 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs md:text-sm transition-all shadow-xl ${!esVentanaPermitida ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-[#E67E22] hover:bg-[#D35400] active:scale-[0.98] shadow-orange-200'}`}
                    >
                        Confirmar y Finalizar Pedido
                    </button>
                </div>
            </div>
        </div>
    );
}
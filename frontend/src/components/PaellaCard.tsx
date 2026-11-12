// ARCHIVO: src/components/PaellaCard.tsx
import React from 'react';

interface Props {
    nombre: string;
    precioPersona: number;
    descripcion: string;
    imagen: string;
    categoria?: string; // ✨ NUEVO: Añadimos la categoría en los Props
}

export default function PaellaCard({ nombre, precioPersona, descripcion, imagen, categoria }: Props) {
    
    const handleSeleccionar = () => {
        const seleccionBase = {
            nombreArroz: nombre,
            precioPersona: precioPersona,
            descripcion: descripcion, 
            imagen: imagen
        };
        
        localStorage.setItem('platoBase', JSON.stringify(seleccionBase));
        window.location.href = '/personalizar-pedido';
    };

    // ✨ NUEVO: Comprobamos si este plato es de la familia de los postres
    const esPostre = categoria?.toLowerCase().includes('postre');

    return (
        <div className="flex flex-col group w-full max-w-[400px] mx-auto">
            <div className="relative mb-8 aspect-square overflow-hidden bg-gray-100 rounded-[2rem] shadow-sm group-hover:shadow-2xl transition-all duration-500">
                <img 
                    src={imagen} 
                    alt={nombre} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
            </div>

            <div className="text-left mb-6 flex-grow">
                <h3 className="text-2xl font-black text-[#1a1a1a] uppercase mb-2">{nombre}</h3>
                <div className="flex items-baseline gap-2 mb-4">
                    <p className="text-[#1a1a1a] font-black text-3xl">{precioPersona.toFixed(2)} €</p>
                    
                    {/* ✨ DETALLE EXTRA: Cambiamos "/ persona" por "/ unidad" si es un postre */}
                    <span className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                        {esPostre ? '/ unidad' : '/ persona'}
                    </span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">{descripcion}</p>
            </div>

            {/* ✨ NUEVO: Solo dibujamos el botón si NO es un postre */}
            {!esPostre && (
                <button 
                    onClick={handleSeleccionar}
                    className="w-full bg-[#1a1a1a] text-white py-5 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#E67E22] transition-all duration-500"
                >
                    Seleccionar Raciones
                </button>
            )}
        </div>
    );
}
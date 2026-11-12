// ARCHIVO: src/components/MenuGrid.tsx
import React, { useState, useEffect } from 'react';
import PaellaCard from './PaellaCard';

interface Paella {
    id: number;
    nombre: string;
    precioPersona: number;
    descripcion: string;
    imagen: string;
    categoria: string;
}

interface Props {
    initialPaellas: Paella[];
}

export default function MenuGrid({ initialPaellas }: Props) {
    const [paellas, setPaellas] = useState<Paella[]>(initialPaellas);

    useEffect(() => {
        setPaellas(initialPaellas);
    }, [initialPaellas]);

    if (paellas.length === 0) {
        return (
            <div className="col-span-full text-center py-12">
                <p className="font-serif italic text-gray-400 text-xl">
                    No hay platos disponibles en esta sección actualmente.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24">
            {paellas.map((paella) => (
                <PaellaCard 
                    key={paella.id} 
                    nombre={paella.nombre}
                    precioPersona={paella.precioPersona}
                    descripcion={paella.descripcion}
                    imagen={paella.imagen}
                    categoria={paella.categoria} /* ✨ NUEVO: Le pasamos la categoría a la tarjeta */
                />
            ))}
        </div>
    );
}
// ARCHIVO: src/components/ProcessSteps.tsx
import React from "react";

// 🎓 NOTA PARA EL TFG: "Para las secciones informativas y estáticas de la web como esta, 
// extraje los datos a un pequeño array en código. Esto me permite usar map() en el HTML de abajo 
// para no tener que copiar y pegar el mismo bloque de diseño tres veces seguidas, manteniendo el código limpio (Principio DRY)."
export default function ProcessSteps() {
  const pasos = [
    {
      num: "01",
      titulo: "Reserva Artesanal",
      desc: "Elige tu arroz desde nuestra plataforma. Cada comanda se prepara de forma individual y exclusiva para garantizar la máxima calidad.",
      color: "text-[#E67E22]", // Naranja corporativo
    },
    {
      num: "02",
      titulo: "Fuego y Precisión",
      desc: "Controlamos milimétricamente cada etapa de la cocción. Una temperatura constante nos permite lograr el punto perfecto del grano y nuestro característico socarrat.",
      color: "text-[#D35400]", // Naranja más intenso/caldera
    },
    {
      num: "03",
      titulo: "Recogida o Envío",
      desc: "Tu paella estará lista en el minuto exacto. Pasa a recogerla por nuestro local o elige el envío a domicilio para disfrutar del sabor recién hecho en casa.",
      color: "text-[#A04000]", // Tono tierra oscuro
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6">
      
      {/* Título de sección adaptativo */}
      <div className="text-center mb-16 md:mb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <span className="text-[#E67E22] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] text-[9px] md:text-[11px] mb-4 block">
          El Ritual
        </span>
        <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl italic text-[#111] tracking-tighter leading-tight">
          ¿Cómo lo hacemos?
        </h2>
        <div className="h-[2px] w-16 md:w-24 bg-[#E67E22] mx-auto mt-6 md:mt-8 shadow-sm"></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
        
        {/* LADO IZQUIERDO: La Imagen */}
        <div className="relative group order-2 lg:order-1">
          {/* Resplandor elegante trasero */}
          <div className="absolute -inset-2 md:-inset-4 bg-gradient-to-tr from-[#E67E22]/30 to-transparent rounded-[2rem] md:rounded-[3rem] blur-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-700"></div>
          
          <div className="relative rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-xl border-[6px] md:border-[12px] border-white bg-white">
            <img
              src="/images/paella_butano.jpeg"
              alt="Elaboración de paellas Arrozeo"
              className="w-full aspect-square md:aspect-[4/5] object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
            />
            {/* Gradiente súper sutil para dar volumen */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
          </div>
        </div>

        {/* LADO DERECHO: Los pasos */}
        <div className="space-y-8 md:space-y-12 order-1 lg:order-2">
          {pasos.map((p, index) => (
            <div key={index} className="flex gap-5 md:gap-8 group">
              
              {/* Número: Opacidad estática en móvil (40%), animada en PC (20% -> 100%) */}
              <div className="flex-shrink-0 pt-1 md:pt-0">
                <span
                  className={`font-serif italic text-5xl md:text-6xl lg:text-7xl font-black leading-none ${p.color} opacity-40 lg:opacity-20 lg:group-hover:opacity-100 transition-opacity duration-500`}
                >
                  {p.num}
                </span>
              </div>

              {/* Texto: Bordes separadores en móvil, limpios en PC */}
              <div className="pb-6 md:pb-0 border-b border-gray-100 md:border-none lg:group-hover:translate-x-2 transition-transform duration-500 w-full">
                <h3 className="text-lg md:text-2xl font-bold text-[#111] uppercase tracking-wide mb-2 md:mb-3">
                  {p.titulo}
                </h3>
                <p className="text-sm md:text-lg text-gray-500 leading-relaxed font-light">
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
}
import React from 'react';
import { Sparkles, Play, Rocket, CheckCircle2, Award } from 'lucide-react';
import { InatecLogo } from './InatecLogo';

interface WelcomeModalProps {
  isOpen: boolean;
  onStart: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onStart }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-sky-100 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Top Header Glow Decoration */}
        <div className="relative bg-gradient-to-br from-sky-50 via-blue-50 to-teal-50 px-5 pt-6 pb-4 border-b border-sky-100 flex flex-col items-center text-center">
          {/* Decorative ambient spots */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-sky-300/30 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-300/25 rounded-full blur-2xl pointer-events-none" />

          {/* Official INATEC Tecnológico Nacional SVG Logo */}
          <div className="w-full max-w-[270px] sm:max-w-[310px] mb-2 flex items-center justify-center">
            <InatecLogo className="w-full h-auto max-h-24 sm:max-h-28 object-contain select-none" />
          </div>

          {/* Subtitle Badge: Center & Location */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 backdrop-blur-xs rounded-full border border-sky-200 text-sky-900 text-xs sm:text-sm font-black shadow-xs tracking-tight">
            <Award className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>CT. Ricardo Morales Avilés, Diriamba</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-slate-700">
          
          {/* Main Title & Clear Instructions */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md">
              <Sparkles className="w-3 h-3 text-teal-600" />
              <span>Instrucciones de la Misión</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-slate-900 leading-snug">
              ¿Qué debes hacer para <span className="text-blue-600">jugar</span>?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              Sigue estos 3 sencillos pasos para programar el dron agrícola y resolver cada desafío:
            </p>
          </div>

          {/* 3 Step-by-Step Instructions */}
          <div className="grid grid-cols-1 gap-2.5 pt-1">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-xs sm:text-sm">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                1
              </div>
              <div>
                <strong className="block text-slate-900 font-bold text-xs sm:text-sm">1. Conecta tus bloques de código</strong>
                <span className="text-slate-600 text-[11px] sm:text-xs">
                  Arrastra instrucciones como <strong>AVANZAR</strong> y <strong>GIRAR</strong> debajo del bloque <strong>AL INICIAR ⚑</strong>.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs sm:text-sm">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                2
              </div>
              <div>
                <strong className="block text-slate-900 font-bold text-xs sm:text-sm">2. Esquiva obstáculos y cosecha</strong>
                <span className="text-slate-600 text-[11px] sm:text-xs">
                  Traza una ruta libre de árboles o rocas y usa el bloque <strong>COSECHAR</strong> sobre cada zanahoria 🥕.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-xs sm:text-sm">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                3
              </div>
              <div>
                <strong className="block text-slate-900 font-bold text-xs sm:text-sm">3. Presiona RUN y acumula tu racha</strong>
                <span className="text-slate-600 text-[11px] sm:text-xs">
                  Pulsa el botón <strong>RUN</strong> para ver volar al dron en 3D. ¡Supera niveles seguidos sin fallar para aumentar tu racha 🔥!
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer: Iniciar button */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 font-medium text-center sm:text-left flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Presiona Iniciar para comenzar tu primer vuelo</span>
          </div>

          <button
            onClick={onStart}
            className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-blue-600 via-sky-600 to-teal-500 hover:from-blue-700 hover:via-sky-700 hover:to-teal-600 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg shadow-sky-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>¡Entendido, Iniciar!</span>
            <Rocket className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

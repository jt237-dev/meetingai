import React, { useState } from 'react';
import { FileText, Download, LayoutTemplate, Settings2 } from 'lucide-react';
export function Exports() {
  const [format, setFormat] = useState('pdf');
  const [template, setTemplate] = useState('executive');
  const templates = [
  {
    id: 'executive',
    name: 'Résumé exécutif',
    desc: 'Résumé de haut niveau, décisions et actions uniquement.'
  },
  {
    id: 'detailed',
    name: 'Analyse détaillée',
    desc: 'Rapport complet incluant les points forts de la transcription.'
  },
  {
    id: 'action',
    name: 'Orienté action',
    desc: 'Priorise les tâches, les responsables et les échéances.'
  }];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black tracking-tight">
          Génération de rapports
        </h1>
        <p className="text-gray-500 mt-1">
          Configurez et exportez vos rapports de réunion IA.
        </p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-8">
        {/* Controls Panel */}
        <div className="w-full lg:w-1/3 space-y-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5" />
              Sélectionner un modèle
            </h2>
            <div className="space-y-3">
              {templates.map((t) =>
              <label
                key={t.id}
                className={`block p-4 rounded-xl border cursor-pointer transition-colors ${template === t.id ? 'border-[#ee3124] bg-[#ee3124]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                
                  <div className="flex items-center gap-3">
                    <input
                    type="radio"
                    name="template"
                    value={t.id}
                    checked={template === t.id}
                    onChange={(e) => setTemplate(e.target.value)}
                    className="text-[#ee3124] focus:ring-[#ee3124]" />
                  
                    <div>
                      <p className="font-bold text-black text-sm">{t.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
                    </div>
                  </div>
                </label>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              Format et image de marque
            </h2>

            <div className="space-y-6">
              <div>
                <p className="text-sm font-bold text-[#333333] mb-2">
                  Format d'exportation
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFormat('pdf')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${format === 'pdf' ? 'bg-[#333333] text-white border-[#333333]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                    
                    PDF
                  </button>
                  <button
                    onClick={() => setFormat('docx')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${format === 'docx' ? 'bg-[#333333] text-white border-[#333333]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                    
                    DOCX
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-[#333333] mb-2">
                  Couleur d'accentuation
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#ee3124] ring-2 ring-offset-2 ring-[#ee3124]" />
                  <span className="text-sm text-gray-500">
                    Verrouillé sur la marque (#ee3124)
                  </span>
                </div>
              </div>

              <button className="w-full flex items-center justify-center gap-2 py-3 bg-[#ee3124] text-white rounded-xl font-bold hover:bg-[#d42b1f] transition-colors">
                <Download className="w-4 h-4" />
                Générer le rapport
              </button>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-full lg:w-2/3 bg-gray-200 rounded-2xl border border-gray-300 p-8 flex items-center justify-center overflow-hidden relative">
          <div className="absolute top-4 right-4 bg-black/50 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
            Aperçu en direct
          </div>

          {/* Mock Document Page */}
          <div className="bg-white w-full max-w-[600px] aspect-[1/1.414] shadow-xl rounded-sm p-10 flex flex-col">
            <div className="border-b-2 border-[#ee3124] pb-6 mb-6">
              <h1 className="text-2xl font-bold text-black mb-2">
                Comité de pilotage Projet Athena
              </h1>
              <p className="text-sm text-gray-500">
                12 mai 2026 • Généré par MeetSense AI
              </p>
            </div>

            <div className="space-y-6 flex-1">
              <div>
                <h2 className="text-lg font-bold text-[#ee3124] mb-2">
                  Résumé exécutif
                </h2>
                <div className="h-4 bg-gray-100 rounded w-full mb-2" />
                <div className="h-4 bg-gray-100 rounded w-5/6 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-4/6" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#ee3124] mb-2">
                  Décisions clés
                </h2>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#333333]" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#333333]" />
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#ee3124] mb-2">
                  Actions
                </h2>
                <div className="border border-gray-200 rounded-lg p-3 flex justify-between items-center mb-2">
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                  <div className="h-6 bg-[#ee3124]/10 rounded w-16" />
                </div>
                <div className="border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-6 bg-[#ee3124]/10 rounded w-16" />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 flex justify-between items-center">
              <div className="w-24 h-6 bg-gray-100 rounded" />
              <div className="text-xs text-gray-400">Page 1 sur 3</div>
            </div>
          </div>
        </div>
      </div>
    </div>);

}
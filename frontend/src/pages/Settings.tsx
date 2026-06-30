import React from 'react';
import { Shield, Bell, Bot, Link as LinkIcon, Palette } from 'lucide-react';
export function Settings() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-black tracking-tight">
          Paramètres
        </h1>
        <p className="text-gray-500 mt-1">
          Gérez les préférences de votre espace de travail d'entreprise.
        </p>
      </div>

      <div className="space-y-6">
        {/* Teams Integration */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-[#333333]" />
            <h2 className="font-bold text-black">
              Intégration Microsoft Teams
            </h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-black">Statut de connexion</p>
                <p className="text-sm text-gray-500 mt-1">
                  Connecté en tant qu'administrateur d'entreprise (ID de
                  locataire : 8f7d...)
                </p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">
                Actif
              </span>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100">
              <button className="px-4 py-2 border border-gray-200 text-[#333333] font-bold rounded-xl hover:bg-gray-50 transition-colors text-sm">
                Reconnecter le compte
              </button>
            </div>
          </div>
        </div>

        {/* AI Model Settings */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#333333]" />
            <h2 className="font-bold text-black">Configuration du modèle IA</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-[#333333] mb-2">
                  Modèle de traitement
                </label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-[#ee3124] focus:border-[#ee3124] text-sm">
                  <option>MeetSense Enterprise (Recommandé)</option>
                  <option>MeetSense Fast (Précision moindre)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#333333] mb-2">
                  Langue principale
                </label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-[#ee3124] focus:border-[#ee3124] text-sm">
                  <option>Anglais (US)</option>
                  <option>Anglais (UK)</option>
                  <option>Français</option>
                  <option>Espagnol</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#333333]" />
            <h2 className="font-bold text-black">
              Sécurité et confidentialité
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-bold text-black text-sm">
                  Authentification à deux facteurs
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Exiger l'A2F pour tous les membres de l'espace de travail
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked />
                
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ee3124]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-bold text-black text-sm">
                  Rétention des données
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supprimer automatiquement les transcriptions après 90 jours
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ee3124]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Theme */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#333333]" />
            <h2 className="font-bold text-black">Thème</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-4">
              Le thème de l'espace de travail est verrouillé selon les
              directives de la marque d'entreprise.
            </p>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-[#ee3124] ring-4 ring-gray-100" />
              <div className="w-12 h-12 rounded-full bg-[#333333] ring-4 ring-gray-100" />
              <div className="w-12 h-12 rounded-full bg-black ring-4 ring-gray-100" />
            </div>
          </div>
        </div>
      </div>
    </div>);

}
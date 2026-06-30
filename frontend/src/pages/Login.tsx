import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';
export function Login() {
  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Panel - Abstract AI Visualization */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#111111] relative overflow-hidden flex-col justify-between p-12">
        {/* Decorative Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-[#ee3124] opacity-20 blur-[120px]" />
          <div className="absolute bottom-[10%] -right-[20%] w-[60%] h-[60%] rounded-full bg-[#ee3124] opacity-10 blur-[100px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 font-bold text-2xl text-white tracking-tight mb-12">
            <div className="w-10 h-10 bg-[#ee3124] rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            MeetSense AI
          </div>

          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            L'intelligence de réunion d'entreprise,
            <br />
            <span className="text-[#ee3124]">redéfinie.</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-md">
            Analysez automatiquement les transcriptions Microsoft Teams,
            extrayez les décisions et générez des rapports structurés avec une
            précision inégalée.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm text-gray-500">
          <span>© 2026 MeetSense AI</span>
          <span>•</span>
          <a href="#" className="hover:text-white transition-colors">
            Confidentialité
          </a>
          <span>•</span>
          <a href="#" className="hover:text-white transition-colors">
            Conditions
          </a>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-32 bg-[#fcfcfc]">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          <div className="lg:hidden flex items-center gap-2 font-bold text-2xl text-black tracking-tight mb-8">
            <div className="w-8 h-8 bg-[#ee3124] rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            MeetSense AI
          </div>

          <h2 className="text-3xl font-bold text-black mb-2">Bon retour</h2>
          <p className="text-gray-500 mb-8">
            Connectez-vous à votre espace de travail d'entreprise.
          </p>

          <div className="space-y-6">
            <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-white text-black font-bold hover:bg-gray-50 transition-colors shadow-sm">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                
                <path
                  d="M11.4 24H0V12.6H11.4V24ZM24 24H12.6V12.6H24V24ZM11.4 11.4H0V0H11.4V11.4ZM24 11.4H12.6V0H24V11.4Z"
                  fill="#00A4EF" />
                
              </svg>
              Continuer avec Microsoft Teams
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#fcfcfc] text-gray-500">
                  Ou continuer avec l'email
                </span>
              </div>
            </div>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-bold text-[#333333] mb-1">
                  Email professionnel
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ee3124]/20 focus:border-[#ee3124] transition-all"
                    placeholder="alex@entreprise.com" />
                  
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#333333] mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ee3124]/20 focus:border-[#ee3124] transition-all"
                    placeholder="••••••••" />
                  
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-[#ee3124] focus:ring-[#ee3124] border-gray-300 rounded" />
                  
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-[#333333]">
                    
                    Se souvenir de moi
                  </label>
                </div>

                <div className="text-sm">
                  <a
                    href="#"
                    className="font-bold text-[#ee3124] hover:text-[#d42b1f]">
                    
                    Mot de passe oublié ?
                  </a>
                </div>
              </div>

              <Link
                to="/"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-transparent rounded-xl shadow-sm text-white bg-[#ee3124] hover:bg-[#d42b1f] font-bold transition-colors mt-6">
                
                Se connecter à l'espace de travail
                <ArrowRight className="w-4 h-4" />
              </Link>
            </form>
          </div>
        </div>
      </div>
    </div>);

}
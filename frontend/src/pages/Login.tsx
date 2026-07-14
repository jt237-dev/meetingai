import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight, Loader2, AlertCircle, User } from 'lucide-react';
import { login, register } from '../lib/api';

export function Login() {
  const navigate = useNavigate();

  // Bascule entre connexion et création de compte.
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Veuillez renseigner votre email et votre mot de passe.');
      return;
    }
    if (mode === 'register' && password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, fullName || undefined);
      }
      navigate('/');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(
        detail ||
          (mode === 'login'
            ? 'Email ou mot de passe incorrect.'
            : "Impossible de créer le compte.")
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError(null);
    setPassword('');
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Panneau gauche — visuel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#111111] relative overflow-hidden flex-col justify-between p-12">
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
          <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
          <span>•</span>
          <a href="#" className="hover:text-white transition-colors">Conditions</a>
        </div>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-32 bg-[#fcfcfc]">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          <div className="lg:hidden flex items-center gap-2 font-bold text-2xl text-black tracking-tight mb-8">
            <div className="w-8 h-8 bg-[#ee3124] rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            MeetSense AI
          </div>

          <h2 className="text-3xl font-bold text-black mb-2">
            {mode === 'login' ? 'Bon retour' : 'Créer un compte'}
          </h2>
          <p className="text-gray-500 mb-8">
            {mode === 'login'
              ? 'Connectez-vous à votre espace de travail.'
              : 'Renseignez vos informations pour rejoindre l’espace de travail.'}
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Nom complet — uniquement à l'inscription */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-bold text-[#333333] mb-1">
                  Nom complet
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ee3124]/20 focus:border-[#ee3124] transition-all"
                    placeholder="Junior Tsafack"
                  />
                </div>
              </div>
            )}

            {/* Email */}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ee3124]/20 focus:border-[#ee3124] transition-all"
                  placeholder="vous@entreprise.com"
                />
              </div>
            </div>

            {/* Mot de passe */}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ee3124]/20 focus:border-[#ee3124] transition-all"
                  placeholder="••••••••"
                />
              </div>
              {mode === 'register' && (
                <p className="text-xs text-gray-400 mt-1.5 font-medium">
                  6 caractères minimum.
                </p>
              )}
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Bouton principal */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-transparent rounded-xl shadow-sm text-white bg-[#ee3124] hover:bg-[#d42b1f] font-bold transition-colors mt-6 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? "Se connecter à l'espace de travail" : 'Créer mon compte'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bascule connexion / inscription */}
          <p className="text-center text-sm text-gray-500 mt-8">
            {mode === 'login' ? "Vous n'avez pas de compte ?" : 'Vous avez déjà un compte ?'}{' '}
            <button
              type="button"
              onClick={switchMode}
              className="font-bold text-[#ee3124] hover:text-[#d42b1f] transition-colors"
            >
              {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  UploadCloud, Video, CheckCircle2, Film,
  Loader2, Sparkles, ArrowRight, AlertCircle, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { uploadMeeting } from '../lib/api';
import axios from 'axios';

const STEPS = [
  'Lecture et extraction du fichier',
  'Identification des intervenants',
  'Analyse du contexte et des décisions',
  'Génération du rapport IA structuré',
];

export function Import() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [step, setStep] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [meetingId, setMeetingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isProcessing && step < STEPS.length - 1) {
      const timer = setTimeout(() => setStep((s) => s + 1), 3000);
      return () => clearTimeout(timer);
    }
  }, [isProcessing, step]);

  const handleFile = (file: File) => {
    const allowed = ['.vtt', '.docx', '.txt', '.srt'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      setError(`Format non supporté. Formats acceptés : ${allowed.join(', ')}`);
      return;
    }
    setSelectedFile(file);
    setError(null);
    setSavedSuccess(false);
  };

  // Analyse complète avec IA
  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setStep(0);
    setError(null);
    try {
      const res = await uploadMeeting(selectedFile);
      setStep(STEPS.length);
      setMeetingId(res.data.meeting_id);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Erreur lors de l'analyse. Réessayez.");
      setIsProcessing(false);
      setStep(0);
    }
  };

  // Enregistrement sans analyse (status pending)
  const handleSavePending = async () => {
    if (!selectedFile) return;
    setIsSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await axios.post(
        'http://localhost:8000/api/upload/pending',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setSavedSuccess(true);
      setMeetingId(res.data.meeting_id);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Erreur lors de l'enregistrement.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-black tracking-tight">
          Importer une réunion
        </h1>
        <p className="text-gray-500 mt-1">
          Téléchargez une transcription ou une vidéo pour générer un rapport intelligent.
        </p>
      </div>

      {!isProcessing ? (
        <div className="flex flex-col gap-6">

          {/* ── Ligne 1 : Transcription texte + Teams ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Bloc transcription texte */}
            <div
              className={`bg-white rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[340px]
                ${isDragging ? 'border-[#ee3124] bg-[#ee3124]/5' : 'border-gray-200 hover:border-[#ee3124]/50 hover:bg-gray-50'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".vtt,.docx,.txt,.srt"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-5">
                <UploadCloud className="w-7 h-7 text-[#333333]" />
              </div>
              <h2 className="text-lg font-bold text-black mb-2">Transcription texte</h2>
              <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
                Importez directement votre fichier de transcription.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
                {['.TXT', '.DOCX', '.VTT', '.SRT'].map((ext) => (
                  <span key={ext} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg border border-gray-200">
                    {ext}
                  </span>
                ))}
              </div>

              {savedSuccess ? (
                <div className="w-full space-y-3">
                  <div className="px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-sm font-bold text-green-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    Réunion enregistrée — visible dans Réunions
                  </div>
                  <Link
                    to="/meetings"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-5 py-2.5 bg-[#333333] text-white font-bold rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    Voir mes réunions
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : selectedFile ? (
                <div className="w-full space-y-3" onClick={(e) => e.stopPropagation()}>
                  <div className="px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-sm font-bold text-green-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{selectedFile.name}</span>
                  </div>
                  {/* Deux boutons côte à côte */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleSavePending}
                      disabled={isSaving}
                      className="px-3 py-2.5 bg-white border-2 border-[#333333] text-[#333333] font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 text-xs disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      Analyse future
                    </button>
                    <button
                      onClick={handleUpload}
                      className="px-3 py-2.5 bg-[#ee3124] text-white font-bold rounded-xl hover:bg-[#d42b1f] transition-colors flex items-center justify-center gap-1.5 text-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Analyser avec l'IA
                    </button>
                  </div>
                </div>
              ) : (
                <button className="px-5 py-2.5 bg-[#333333] text-white font-bold rounded-xl hover:bg-black transition-colors text-sm">
                  Parcourir les fichiers
                </button>
              )}

              {error && (
                <div className="mt-3 flex items-center gap-2 text-sm text-red-600 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>

            {/* Bloc Teams live */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col justify-between min-h-[340px] relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-lg border border-yellow-200">
                  Bientôt disponible
                </span>
              </div>
              <div>
                <div className="w-14 h-14 bg-[#ee3124]/10 rounded-2xl flex items-center justify-center mb-5 opacity-60">
                  <Video className="w-7 h-7 text-[#ee3124]" />
                </div>
                <h2 className="text-lg font-bold text-black mb-2 opacity-60">Réunion en direct</h2>
                <p className="text-sm text-gray-500 mb-4 opacity-60">
                  Le bot MeetingAI rejoindra votre réunion Microsoft Teams active pour transcrire et analyser en temps réel.
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">
                    Lien de la réunion Teams
                  </label>
                  <input
                    type="text"
                    disabled
                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 placeholder-gray-400 text-sm cursor-not-allowed opacity-60"
                    placeholder="https://teams.microsoft.com/..."
                  />
                </div>
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-200 text-gray-400 font-bold rounded-xl cursor-not-allowed text-sm"
                >
                  Rejoindre la réunion
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Ligne 2 : Transcription vidéo pleine largeur ── */}
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-lg border border-yellow-200">
                Bientôt disponible
              </span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-16 h-16 bg-[#ee3124]/10 rounded-2xl flex items-center justify-center flex-shrink-0 opacity-60">
                <Film className="w-8 h-8 text-[#ee3124]" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-lg font-bold text-black mb-1 opacity-60">
                  Transcription automatique de vidéo
                </h2>
                <p className="text-sm text-gray-500 opacity-60 max-w-2xl">
                  Uploadez directement votre vidéo de réunion — MeetingAI la transcrit automatiquement via Whisper AI
                  puis génère le rapport complet. Idéal pour les réunions enregistrées sans transcription disponible.
                </p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                  {['.MP4', '.MKV', '.MOV', '.WEBM', '.AVI'].map((ext) => (
                    <span key={ext} className="px-2.5 py-1 bg-gray-100 text-gray-400 text-xs font-bold rounded-lg border border-gray-200">
                      {ext}
                    </span>
                  ))}
                </div>
              </div>
              <button
                disabled
                className="px-6 py-3 bg-gray-200 text-gray-400 font-bold rounded-xl cursor-not-allowed text-sm flex-shrink-0"
              >
                Parcourir les vidéos
              </button>
            </div>
          </div>

        </div>
      ) : (
        /* ── Écran de traitement ── */
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
          <div className="bg-white rounded-3xl border border-gray-200 p-12 shadow-sm w-full text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100">
              <motion.div
                className="h-full bg-[#ee3124]"
                initial={{ width: '0%' }}
                animate={{ width: `${(step / STEPS.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="w-24 h-24 bg-[#ee3124]/10 rounded-3xl flex items-center justify-center mx-auto mb-8 relative">
              {step === STEPS.length ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-500">
                  <CheckCircle2 className="w-12 h-12" />
                </motion.div>
              ) : (
                <>
                  <Sparkles className="w-10 h-10 text-[#ee3124] relative z-10" />
                  <motion.div
                    className="absolute inset-0 border-4 border-[#ee3124]/20 rounded-3xl border-t-[#ee3124]"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                </>
              )}
            </div>

            <h2 className="text-2xl font-bold text-black mb-10">
              {step === STEPS.length ? 'Analyse terminée !' : "L'IA analyse votre réunion..."}
            </h2>

            <div className="space-y-5 text-left max-w-md mx-auto">
              {STEPS.map((s, i) => {
                const isCompleted = i < step;
                const isCurrent = i === step;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.2 }}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${isCurrent ? 'bg-gray-50 border border-gray-200' : 'border border-transparent'}`}
                  >
                    {isCompleted ? (
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                    ) : isCurrent ? (
                      <Loader2 className="w-6 h-6 text-[#ee3124] animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-200 flex-shrink-0" />
                    )}
                    <span className={`text-sm font-bold ${isCompleted ? 'text-[#333333]' : isCurrent ? 'text-black' : 'text-gray-400'}`}>
                      {s}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {step === STEPS.length && meetingId && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-10">
                <Link
                  to={`/meetings/${meetingId}`}
                  className="inline-flex items-center justify-center gap-2 w-full py-4 bg-[#ee3124] text-white rounded-xl font-bold hover:bg-[#d42b1f] transition-colors text-lg"
                >
                  Voir le rapport IA
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
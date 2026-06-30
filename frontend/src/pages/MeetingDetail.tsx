import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar, Clock, Users, Download, Share2, Sparkles,
  CheckCircle2, AlertCircle, Target, Lightbulb,
  ListTodo, ChevronDown, ChevronUp, Loader2,
  ArrowLeft, FileText
} from 'lucide-react';
import { getMeeting, exportPDF } from '../lib/api';

interface Participant { name: string; role: string | null; }
interface Task { id: number; title: string; assigned_to: string | null; due_date: string | null; status: string; }
interface Meeting {
  id: number;
  title: string;
  date: string;
  duration: number | null;
  status: string;
  summary: string | null;
  transcript: string | null;
  problematique: string | null;
  objectifs: string | null;
  solutions: string | null;
  consequences: string | null;
  decisions: string | null;
  participants: Participant[];
  tasks: Task[];
  ai_confidence: number | null;
}

const ExpandableCard = ({ title, icon: Icon, children, defaultOpen = true, color = 'gray' }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const colorMap: Record<string, string> = {
    gray: 'text-[#333333] bg-gray-50 border-gray-200',
    red: 'text-[#ee3124] bg-[#ee3124]/5 border-[#ee3124]/20',
    green: 'text-green-600 bg-green-50 border-green-200',
    amber: 'text-amber-600 bg-amber-50 border-amber-200',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${colorMap[color].split(' ').slice(1).join(' ')}`}>
            <Icon className={`w-4 h-4 ${colorMap[color].split(' ')[0]}`} />
          </div>
          <h3 className="text-base font-bold text-black">{title}</h3>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100"
          >
            <div className="p-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export function MeetingDetail() {
  const { id } = useParams<{ id: string }>();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    if (!id) return;
    getMeeting(Number(id))
      .then((res) => setMeeting(res.data))
      .catch(() => setError('Réunion introuvable.'))
      .finally(() => setLoading(false));
  }, [id]);

  const parseJson = (value: string | null): string[] => {
    if (!value) return [];
    try { return JSON.parse(value); }
    catch { return []; }
  };

  const handleExport = async (template: string) => {
    if (!meeting) return;
    setExportLoading(true);
    setShowExportMenu(false);
    try {
      const res = await exportPDF(meeting.id, template);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `CR_${meeting.title.slice(0, 40)}_${template}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Erreur lors de l\'export PDF.');
    } finally {
      setExportLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch { return dateStr; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#ee3124]" />
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-medium mb-4">{error || 'Réunion introuvable.'}</p>
        <Link to="/meetings" className="text-sm font-bold text-[#ee3124] hover:underline">
          ← Retour aux réunions
        </Link>
      </div>
    );
  }

  const decisions    = parseJson(meeting.decisions);
  const objectifs    = parseJson(meeting.objectifs);
  const solutions    = parseJson(meeting.solutions);
  const consequences = parseJson(meeting.consequences);
  const isPending    = meeting.status === 'pending';

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#f5f5f5]">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 flex-shrink-0 z-10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link to="/meetings" className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-[#ee3124] transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                Réunions
              </Link>
              {meeting.status === 'completed' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#ee3124]/10 text-[#ee3124] text-xs font-bold uppercase tracking-wider border border-[#ee3124]/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  Analysé par l'IA
                </span>
              )}
              {meeting.ai_confidence && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-bold border border-green-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {meeting.ai_confidence}% Confiance IA
                </span>
              )}
              {isPending && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider border border-gray-200">
                  <Clock className="w-3.5 h-3.5" />
                  Importée — Analyse en attente
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-black mb-3">{meeting.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(meeting.date)}
              </div>
              {meeting.duration && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {meeting.duration} min
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {meeting.participants.length} participants
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {meeting.status === 'completed' && (
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={exportLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#ee3124] rounded-xl hover:bg-[#d42b1f] transition-colors shadow-sm disabled:opacity-50"
                >
                  {exportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Exporter PDF
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50 w-48">
                    {[
                      { label: '📄 Classique', value: 'classic' },
                      { label: '✨ Élégant', value: 'elegant' },
                      { label: '🎨 Moderne', value: 'modern' },
                    ].map((t) => (
                      <button
                        key={t.value}
                        onClick={() => handleExport(t.value)}
                        className="w-full px-4 py-3 text-sm font-bold text-left text-[#333333] hover:bg-gray-50 transition-colors"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenu selon statut */}
      {isPending ? (
        /* ── Réunion en attente d'analyse ── */
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white rounded-3xl border border-gray-200 p-12 shadow-sm max-w-lg w-full text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-black mb-3">
              Réunion importée — Analyse en attente
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              Le fichier a été enregistré. Lancez l'analyse IA pour générer le rapport complet avec résumé, décisions, tâches et export PDF.
            </p>
            <button
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-[#ee3124] text-white rounded-xl font-bold hover:bg-[#d42b1f] transition-colors"
              onClick={async () => {
                setLoading(true);
                try {
                  const { data } = await import('../lib/api').then(m => m.getMeeting(Number(id)));
                  // TODO: déclencher l'analyse depuis le transcript existant
                  alert('Fonctionnalité d\'analyse différée — bientôt disponible !');
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Sparkles className="w-5 h-5" />
              Lancer l'analyse IA maintenant
            </button>
          </div>
        </div>
      ) : (
        /* ── Vue split panel ── */
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

          {/* Transcription */}
          <div className="w-full lg:w-1/2 flex flex-col border-r border-gray-200 bg-white">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="font-bold text-black">Transcription originale</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {meeting.transcript ? (
                meeting.transcript.split('\n').filter(l => l.trim()).map((line, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex-1">
                      <p className="text-[#333333] leading-relaxed text-sm">{line}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">Aucune transcription disponible.</p>
              )}
            </div>
          </div>

          {/* Rapport IA */}
          <div className="w-full lg:w-1/2 flex flex-col bg-[#f5f5f5]">
            <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#ee3124]" />
              <h2 className="font-bold text-black">Rapport IA structuré</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6">

              {meeting.summary && (
                <ExpandableCard title="Résumé exécutif" icon={Sparkles} color="red">
                  <p className="text-[#333333] leading-relaxed text-sm">{meeting.summary}</p>
                </ExpandableCard>
              )}

              {meeting.problematique && (
                <ExpandableCard title="Problématique" icon={AlertCircle} color="gray">
                  <p className="text-[#333333] leading-relaxed text-sm">{meeting.problematique}</p>
                </ExpandableCard>
              )}

              {objectifs.length > 0 && (
                <ExpandableCard title="Objectifs" icon={Target} color="gray">
                  <ul className="space-y-3">
                    {objectifs.map((obj, i) => (
                      <li key={i} className="flex items-start gap-3 text-[#333333] text-sm">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gray-400 mt-2" />
                        {obj}
                      </li>
                    ))}
                  </ul>
                </ExpandableCard>
              )}

              {solutions.length > 0 && (
                <ExpandableCard title="Solutions proposées" icon={Lightbulb} color="gray">
                  <ul className="space-y-3">
                    {solutions.map((sol, i) => (
                      <li key={i} className="flex items-start gap-3 text-[#333333] text-sm">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gray-400 mt-2" />
                        {sol}
                      </li>
                    ))}
                  </ul>
                </ExpandableCard>
              )}

              {consequences.length > 0 && (
                <ExpandableCard title="Conséquences & Impacts" icon={AlertCircle} color="amber">
                  <ul className="space-y-3">
                    {consequences.map((c, i) => (
                      <li key={i} className="flex items-start gap-3 text-[#333333] text-sm">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400 mt-2" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </ExpandableCard>
              )}

              {decisions.length > 0 && (
                <ExpandableCard title="Décisions prises" icon={CheckCircle2} color="green">
                  <ul className="space-y-3">
                    {decisions.map((dec, i) => (
                      <li key={i} className="flex items-start gap-3 text-[#333333] text-sm">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
                        {dec}
                      </li>
                    ))}
                  </ul>
                </ExpandableCard>
              )}

              {meeting.participants.length > 0 && (
                <ExpandableCard title="Participants" icon={Users} color="gray" defaultOpen={false}>
                  <div className="space-y-2">
                    {meeting.participants.map((p, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <span className="text-sm font-bold text-[#333333]">{p.name}</span>
                        {p.role && <span className="text-xs text-gray-500 font-medium">{p.role}</span>}
                      </div>
                    ))}
                  </div>
                </ExpandableCard>
              )}

              {meeting.tasks && meeting.tasks.length > 0 && (
                <ExpandableCard title="Plan d'action — Tâches" icon={ListTodo} color="red">
                  <div className="space-y-3">
                    {meeting.tasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-black">{task.title}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs font-bold text-gray-500">
                            {task.assigned_to && <span>👤 {task.assigned_to}</span>}
                            {task.due_date && (
                              <span>📅 {new Date(task.due_date).toLocaleDateString('fr-FR')}</span>
                            )}
                            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                              task.status === 'done' ? 'bg-green-100 text-green-700' :
                              task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {task.status === 'done' ? 'Terminé' : task.status === 'in_progress' ? 'En cours' : 'À faire'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ExpandableCard>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
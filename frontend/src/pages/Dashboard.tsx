import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, Users, Sparkles, FileText,
  ChevronRight, CheckSquare, TrendingUp, Loader2
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { getMeetings } from '../lib/api';

interface Meeting {
  id: number;
  title: string;
  date: string;
  duration: number | null;
  status: string;
  ai_confidence: number | null;
  participants: { name: string; role: string | null }[];
}

export function Dashboard() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMeetings()
      .then((res) => setMeetings(res.data))
      .finally(() => setLoading(false));
  }, []);

  // ── Stats calculées depuis les vraies données ─────────────────
  const totalMeetings   = meetings.length;
  const completedMeetings = meetings.filter(m => m.status === 'completed').length;
  const pendingMeetings = meetings.filter(m => m.status === 'pending').length;
  const allParticipants = meetings.flatMap(m => m.participants.map(p => p.name));
  const uniqueParticipants = new Set(allParticipants).size;
  const confidences     = meetings.filter(m => m.ai_confidence).map(m => m.ai_confidence as number);
  const avgConfidence   = confidences.length
    ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
    : 0;

  // ── Graphique : réunions par jour (7 derniers jours) ─────────
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString('fr-FR', { weekday: 'short' });
    const dateStr = d.toISOString().split('T')[0];
    const count = meetings.filter(m => m.date?.startsWith(dateStr)).length;
    return { name: label, meetings: count };
  });

  const recentMeetings = meetings.slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
            Traité
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ee3124]/10 text-[#ee3124] border border-[#ee3124]/20">
            Analyse IA
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">
            Importée
          </span>
        );
      default: return null;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#ee3124]" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight">
            Tableau de bord
          </h1>
          <p className="text-gray-500 mt-1">
            Vue d'ensemble de votre intelligence de réunion.
          </p>
        </div>
        <Link
          to="/import"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-[#ee3124] rounded-xl hover:bg-[#d42b1f] transition-colors shadow-sm"
        >
          <Sparkles className="w-4 h-4" />
          Nouvelle analyse
        </Link>
      </div>

      {/* ── Stats ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {[
          {
            icon: FileText,
            label: 'Total réunions',
            value: totalMeetings,
            badge: completedMeetings > 0 ? `${completedMeetings} traitées` : null,
            badgeColor: 'text-green-600 bg-green-50',
          },
          {
            icon: Users,
            label: 'Participants uniques',
            value: uniqueParticipants,
            badge: null,
            badgeColor: '',
          },
          {
            icon: Sparkles,
            label: 'Précision IA moy.',
            value: avgConfidence ? `${avgConfidence}%` : '—',
            badge: null,
            badgeColor: '',
            iconColor: 'bg-[#ee3124]/10 border-[#ee3124]/20',
            iconClass: 'text-[#ee3124]',
          },
          {
            icon: CheckSquare,
            label: 'Importées',
            value: pendingMeetings,
            badge: pendingMeetings > 0 ? 'En attente' : null,
            badgeColor: 'text-[#ee3124] bg-[#ee3124]/10',
          },
          {
            icon: TrendingUp,
            label: 'Taux d\'analyse',
            value: totalMeetings > 0
              ? `${Math.round((completedMeetings / totalMeetings) * 100)}%`
              : '—',
            badge: null,
            badgeColor: '',
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconColor || 'bg-gray-50 border border-gray-100'}`}>
                <stat.icon className={`w-5 h-5 ${stat.iconClass || 'text-[#333333]'}`} />
              </div>
              {stat.badge && (
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${stat.badgeColor}`}>
                  {stat.badge}
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-black mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Graphique ── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-black">Activité — 7 derniers jours</h2>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e5e5' }} />
                <Line type="monotone" dataKey="meetings" stroke="#333333" strokeWidth={3}
                  dot={{ r: 4, fill: '#333333', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#ee3124', stroke: '#fff' }}
                  name="Réunions" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Insights IA ── */}
        <div className="bg-[#333333] rounded-2xl border border-[#444444] shadow-sm p-6 text-white flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#ee3124] rounded-full opacity-20 blur-[40px] pointer-events-none" />
          <div className="flex items-center gap-2 mb-6 relative z-10">
            <Sparkles className="w-5 h-5 text-[#ee3124]" />
            <h2 className="text-lg font-bold">Insights</h2>
          </div>
          <div className="space-y-4 flex-1 relative z-10">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-gray-300 mb-1">Réunions analysées</p>
              <p className="text-2xl font-bold">{completedMeetings} <span className="text-sm font-normal text-gray-400">/ {totalMeetings} total</span></p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-gray-300 mb-1">Confiance IA moyenne</p>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-bold">{avgConfidence || '—'}{avgConfidence ? '%' : ''}</p>
                {avgConfidence > 0 && (
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${avgConfidence > 90 ? 'bg-green-400' : avgConfidence > 70 ? 'bg-yellow-400' : 'bg-red-400'}`}
                      style={{ width: `${avgConfidence}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-gray-300 mb-1">Participants uniques</p>
              <p className="text-2xl font-bold">{uniqueParticipants}</p>
            </div>
          </div>
          <Link
            to="/meetings"
            className="mt-6 w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-colors relative z-10 text-center block"
          >
            Voir toutes les réunions
          </Link>
        </div>
      </div>

      {/* ── Réunions récentes ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-black">Réunions récentes</h2>
          <Link to="/meetings" className="text-sm font-bold text-[#ee3124] hover:underline">
            Voir tout
          </Link>
        </div>

        {recentMeetings.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-black mb-1">Aucune réunion</h3>
            <p className="text-sm text-gray-500 mb-4">Importez votre première réunion.</p>
            <Link
              to="/import"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#ee3124] rounded-xl hover:bg-[#d42b1f] transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Importer une réunion
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentMeetings.map((meeting) => (
              <div key={meeting.id} className="p-6 hover:bg-gray-50 transition-colors group">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        to={`/meetings/${meeting.id}`}
                        className="text-base font-bold text-black group-hover:text-[#ee3124] truncate transition-colors"
                      >
                        {meeting.title}
                      </Link>
                      {getStatusBadge(meeting.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {new Date(meeting.date).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </span>
                      {meeting.duration && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {meeting.duration} min
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        {meeting.participants?.length || 0} participants
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 ml-4">
                    {meeting.ai_confidence && (
                      <div className="hidden md:flex flex-col items-end">
                        <span className="text-xs text-gray-400 font-bold mb-1">Confiance IA</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${meeting.ai_confidence > 90 ? 'bg-green-500' : meeting.ai_confidence > 70 ? 'bg-yellow-500' : 'bg-red-400'}`}
                              style={{ width: `${meeting.ai_confidence}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-[#333333]">{meeting.ai_confidence}%</span>
                        </div>
                      </div>
                    )}
                    <Link
                      to={`/meetings/${meeting.id}`}
                      className="p-2 text-gray-400 group-hover:text-[#ee3124] group-hover:bg-[#ee3124]/10 rounded-xl transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
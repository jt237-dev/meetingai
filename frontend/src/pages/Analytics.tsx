import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Sparkles, Clock, Users,
  MessageCircle, Loader2, CheckCircle2, UserCog
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { getAnalytics } from '../lib/api';

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid #e5e5e5',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  fontFamily: 'Inter',
  fontSize: '12px',
};
const axisStyle = { fill: '#6b7280', fontSize: 12, fontFamily: 'Inter' };

interface AnalyticsData {
  cards: {
    total_meetings: number;
    avg_duration: number | null;
    avg_decisions: number;
    avg_confidence: number | null;
    total_tasks: number;
  };
  monthly_trends: { name: string; meetings: number; decisions: number; tasks: number }[];
  top_participants: { name: string; count: number }[];
  top_presidents: { name: string; count: number }[];
  sentiment_distribution: { name: string; value: number; color: string }[];
}

export function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAnalytics()
      .then((res) => setData(res.data))
      .catch(() => setError("Impossible de charger les analyses."))
      .finally(() => setLoading(false));
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#ee3124]" />
      </div>
    );
  }

  if (error || !data) {
    return <div className="p-8 text-center text-red-500 font-medium">{error || 'Aucune donnée.'}</div>;
  }

  const { cards } = data;
  const hasMeetings = cards.total_meetings > 0;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-black tracking-tight">Analyses Avancées</h1>
        <p className="text-gray-500 mt-1">
          Indicateurs calculés à partir de vos réunions analysées.
        </p>
      </div>

      {!hasMeetings ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
          <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-black mb-1">Pas encore de données</h3>
          <p className="text-sm text-gray-500">
            Analysez au moins une réunion pour voir apparaître les statistiques.
          </p>
        </div>
      ) : (
        <>
          {/* Cartes indicateurs */}
          <motion.div
            variants={containerVariants} initial="hidden" animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                <BarChart3 className="w-5 h-5 text-[#333333]" />
              </div>
              <p className="text-sm font-bold text-gray-500">Total réunions</p>
              <p className="text-2xl font-bold text-black mt-1">{cards.total_meetings}</p>
              <p className="text-xs text-gray-400 mt-1 font-medium">{cards.total_tasks} tâches identifiées</p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                <Clock className="w-5 h-5 text-[#333333]" />
              </div>
              <p className="text-sm font-bold text-gray-500">Durée moyenne</p>
              <p className="text-2xl font-bold text-black mt-1">
                {cards.avg_duration != null ? `${cards.avg_duration} min` : '—'}
              </p>
              <p className="text-xs text-gray-400 mt-1 font-medium">par réunion</p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                <MessageCircle className="w-5 h-5 text-[#333333]" />
              </div>
              <p className="text-sm font-bold text-gray-500">Décisions / réunion</p>
              <p className="text-2xl font-bold text-black mt-1">{cards.avg_decisions}</p>
              <p className="text-xs text-gray-400 mt-1 font-medium">en moyenne</p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#ee3124]/10 border border-[#ee3124]/20 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5 text-[#ee3124]" />
              </div>
              <p className="text-sm font-bold text-gray-500">Confiance IA moyenne</p>
              <p className="text-2xl font-bold text-black mt-1">
                {cards.avg_confidence != null ? `${cards.avg_confidence}%` : '—'}
              </p>
              <p className="text-xs text-gray-400 mt-1 font-medium">sur les analyses</p>
            </motion.div>
          </motion.div>

          {/* Tendances mensuelles */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-black">Tendances d'activité</h2>
                <p className="text-sm text-gray-500 mt-1">Réunions, décisions et tâches par mois</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#333333]" /> Réunions</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ee3124]" /> Décisions</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-300" /> Tâches</span>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthly_trends} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisStyle} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={axisStyle} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="meetings" stroke="#333333" strokeWidth={3} dot={{ r: 4, fill: '#333333', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#ee3124', stroke: '#fff' }} name="Réunions" />
                  <Line type="monotone" dataKey="decisions" stroke="#ee3124" strokeWidth={3} dot={{ r: 4, fill: '#ee3124', strokeWidth: 2, stroke: '#fff' }} name="Décisions" />
                  <Line type="monotone" dataKey="tasks" stroke="#d1d5db" strokeWidth={3} dot={{ r: 4, fill: '#d1d5db', strokeWidth: 2, stroke: '#fff' }} name="Tâches" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Deux colonnes : participants + sentiment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top participants */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-black">Participants les plus fréquents</h2>
                <p className="text-sm text-gray-500 mt-1">Nombre de réunions par personne</p>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.top_participants} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e5e5" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={axisStyle} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ ...axisStyle, fontSize: 11 }} width={110} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(238, 49, 36, 0.05)' }} />
                    <Bar dataKey="count" fill="#ee3124" radius={[0, 8, 8, 0]} name="Réunions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sentiment */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-black">Climat des réunions</h2>
                <p className="text-sm text-gray-500 mt-1">Tonalité globale détectée par l'IA</p>
              </div>
              <div className="h-72 w-full flex items-center justify-center">
                {data.sentiment_distribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.sentiment_distribution}
                        cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                        paddingAngle={4} dataKey="value"
                        label={({ name, value }) => `${name} (${value})`}
                        labelLine={false} fontSize={11} fontFamily="Inter">
                        {data.sentiment_distribution.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="#fff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-sm text-gray-400 px-6">
                    <Sparkles className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                    Le sentiment n'est disponible que pour les réunions analysées récemment.
                    Ré-analysez une réunion pour peupler ce graphique.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top présidents */}
          {data.top_presidents.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-black">Présidents de séance</h2>
                  <p className="text-sm text-gray-500 mt-1">Qui préside le plus souvent</p>
                </div>
                <UserCog className="w-5 h-5 text-[#333333]" />
              </div>
              <div className="space-y-3">
                {data.top_presidents.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-[#333333]">
                        {i + 1}
                      </div>
                      <span className="text-sm font-bold text-[#333333]">{p.name}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-500">
                      {p.count} réunion{p.count > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, Users, ChevronRight,
  Filter, Search, Sparkles, LayoutGrid, List as ListIcon, Loader2
} from 'lucide-react';
import { getMeetings } from '../lib/api';

interface Meeting {
  id: number;
  title: string;
  date: string;
  duration: number | null;
  status: string;
  summary: string | null;
  participants: { name: string; role: string | null }[];
  created_at: string;
  ai_confidence: number | null;
}

const STATUS_LABELS: Record<string, string> = {
  all: 'Toutes',
  completed: 'Traitées',
  pending: 'Importée',
};

export function Meetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [view, setView] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    getMeetings()
      .then((res) => setMeetings(res.data))
      .catch(() => setError('Impossible de charger les réunions.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return meetings.filter((m) => {
      const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [meetings, search, statusFilter]);

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
            En attente
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            Échoué
          </span>
        );
      default:
        return null;
    }
  };

  const statusCounts = {
    all: meetings.length,
    completed: meetings.filter((m) => m.status === 'completed').length,
    pending: meetings.filter((m) => m.status === 'pending').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#ee3124]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 font-medium">{error}</div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight">
            Toutes les Réunions
          </h1>
          <p className="text-gray-500 mt-1">
            Parcourez, recherchez et analysez votre bibliothèque de réunions.
          </p>
        </div>
        <Link
          to="/import"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-[#ee3124] rounded-xl hover:bg-[#d42b1f] transition-colors shadow-sm">
          <Sparkles className="w-4 h-4" />
          Importer une réunion
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#ee3124]/20 focus:border-[#ee3124] text-sm transition-all"
              placeholder="Rechercher par titre..."
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {(['all', 'completed', 'pending'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border ${
                  statusFilter === s
                    ? 'bg-[#333333] text-white border-[#333333]'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}>
                {STATUS_LABELS[s]}{' '}
                <span className="ml-1 opacity-60">({statusCounts[s]})</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
          <Filter className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-black mb-1">Aucune réunion trouvée</h3>
          <p className="text-sm text-gray-500">
            Importez votre première réunion ou ajustez vos filtres.
          </p>
          <Link
            to="/import"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#ee3124] rounded-xl hover:bg-[#d42b1f] transition-colors">
            <Sparkles className="w-4 h-4" />
            Importer une réunion
          </Link>
        </div>
      ) : view === 'list' ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filtered.map((meeting, i) => (
              <motion.div
                key={meeting.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="p-6 hover:bg-gray-50 transition-colors group">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        to={`/meetings/${meeting.id}`}
                        className="text-base font-bold text-black group-hover:text-[#ee3124] truncate transition-colors">
                        {meeting.title}
                      </Link>
                      {getStatusBadge(meeting.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium">
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
                        <span className="text-xs text-gray-400 font-bold mb-1">
                          Confiance IA
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${meeting.ai_confidence > 90 ? 'bg-green-500' : meeting.ai_confidence > 70 ? 'bg-yellow-500' : 'bg-red-400'}`}
                              style={{ width: `${meeting.ai_confidence}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-[#333333]">
                            {meeting.ai_confidence}%
                          </span>
                        </div>
                      </div>
                    )}
                    <Link
                      to={`/meetings/${meeting.id}`}
                      className="p-2 text-gray-400 group-hover:text-[#ee3124] group-hover:bg-[#ee3124]/10 rounded-xl transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((meeting, i) => (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}>
              <Link
                to={`/meetings/${meeting.id}`}
                className="block bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:border-[#ee3124]/30 transition-colors h-full">
                <div className="flex items-start justify-between mb-4">
                  {getStatusBadge(meeting.status)}
                </div>
                <h3 className="text-base font-bold text-black mb-3 line-clamp-2 min-h-[3rem]">
                  {meeting.title}
                </h3>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-4 h-4" />
                    {new Date(meeting.date).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </div>
                  {meeting.duration && (
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-4 h-4" />
                      {meeting.duration} min
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 font-medium">
                    <Users className="w-4 h-4" />
                    {meeting.participants?.length || 0} participants
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
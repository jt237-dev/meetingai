import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, TrendingUp, X, ArrowUpRight, Calendar, Loader2, Circle
} from 'lucide-react';
import { getParticipants } from '../lib/api';

interface Participant {
  id: number;
  name: string;
  email: string | null;
  role: string | null;
  present: boolean;
  meeting_id: number;
  meeting_title: string | null;
  meeting_date: string | null;
}

interface AggregatedParticipant {
  name: string;
  role: string | null;
  email: string | null;
  meetings: {
    meeting_id: number;
    title: string;
    date: string | null;
    present: boolean;
  }[];
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');
}

export function Participants() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AggregatedParticipant | null>(null);

  useEffect(() => {
    getParticipants()
      .then((res) => setParticipants(res.data))
      .finally(() => setLoading(false));
  }, []);

  // Regroupe les occurrences d'un même participant (par nom) à travers toutes les réunions
  const aggregated: AggregatedParticipant[] = useMemo(() => {
    const map = new Map<string, AggregatedParticipant>();
    participants.forEach((p) => {
      const key = p.name.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, { name: p.name, role: p.role, email: p.email, meetings: [] });
      }
      const entry = map.get(key)!;
      if (!entry.role && p.role) entry.role = p.role;
      if (!entry.email && p.email) entry.email = p.email;
      entry.meetings.push({
        meeting_id: p.meeting_id,
        title: p.meeting_title || 'Réunion sans titre',
        date: p.meeting_date,
        present: p.present,
      });
    });
    return Array.from(map.values()).sort((a, b) => b.meetings.length - a.meetings.length);
  }, [participants]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return aggregated;
    return aggregated.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.role || '').toLowerCase().includes(q) ||
      p.meetings.some((m) => m.title.toLowerCase().includes(q))
    );
  }, [aggregated, search]);

  const topParticipants = filtered.slice(0, 5);
  const topNames = new Set(topParticipants.map((p) => p.name));
  const otherParticipants = filtered.filter((p) => !topNames.has(p.name));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#ee3124]" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-black tracking-tight">
          Participants
        </h1>
        <p className="text-gray-500 mt-1">
          Retrouvez vos participants les plus actifs et l'historique de leurs réunions.
        </p>
      </div>

      {/* Barre de recherche */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un participant, un rôle, une réunion..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ee3124]/20 focus:border-[#ee3124]/40 transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-0">
        {/* Colonne gauche (~30%) : top participants par nombre de réunions */}
        <div className="lg:col-span-3 lg:pr-8 lg:border-r border-gray-200 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#ee3124]" />
            <h2 className="text-base font-bold text-black">
              Les plus actifs
            </h2>
          </div>

          {topParticipants.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun participant trouvé.</p>
          ) : (
            <div className="space-y-3">
              {topParticipants.map((p, index) => (
                <button
                  key={p.name}
                  onClick={() => setSelected(p)}
                  className="w-full text-left bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-3 hover:border-[#ee3124]/30 transition-colors"
                >
                  <span className="w-5 text-center text-xs font-bold text-gray-400 flex-shrink-0">
                    #{index + 1}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">
                    {initials(p.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black truncate">{p.name}</p>
                    {p.role && <p className="text-xs text-gray-500 truncate">{p.role}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-[#ee3124]">{p.meetings.length}</p>
                    <p className="text-[10px] text-gray-500">réunion{p.meetings.length > 1 ? 's' : ''}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Colonne droite (~70%) : les autres participants */}
        <div className="lg:col-span-7 lg:pl-8 mt-8 lg:mt-0">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[#ee3124]" />
            <h2 className="text-base font-bold text-black">
              Tous les participants
            </h2>
          </div>

          {otherParticipants.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-4" />
              <p className="text-sm font-bold text-gray-500">
                {search ? 'Aucun participant ne correspond à votre recherche.' : 'Aucun autre participant.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {otherParticipants.map((p, i) => (
                <motion.button
                  key={p.name}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelected(p)}
                  className="text-left bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:border-[#ee3124]/30 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">
                      {initials(p.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-black truncate">{p.name}</p>
                      <p className="text-xs text-gray-500 truncate">{p.role || 'Rôle non renseigné'}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    <span className="font-bold text-black">{p.meetings.length}</span> réunion{p.meetings.length > 1 ? 's' : ''}
                  </p>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modale : liste des réunions du participant sélectionné */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">
                    {initials(selected.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-black truncate">{selected.name}</p>
                    {selected.role && <p className="text-xs text-gray-500 truncate">{selected.role}</p>}
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-gray-400 hover:text-black transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto divide-y divide-gray-50">
                {selected.meetings.map((m, i) => (
                  <Link
                    key={`${m.meeting_id}-${i}`}
                    to={`/meetings/${m.meeting_id}`}
                    onClick={() => setSelected(null)}
                    className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-black truncate">{m.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {m.date && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(m.date).toLocaleDateString('fr-FR', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </span>
                        )}
                        <span
                          className={`text-xs font-bold flex items-center gap-1 ${
                            m.present ? 'text-green-600' : 'text-[#ee3124]'
                          }`}
                        >
                          <Circle className={`w-2 h-2 fill-current ${m.present ? 'text-green-600' : 'text-[#ee3124]'}`} />
                          {m.present ? 'Présent' : 'Absent'}
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

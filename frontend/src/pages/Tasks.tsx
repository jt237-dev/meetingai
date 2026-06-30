import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare, Calendar, Sparkles, AlertCircle,
  Clock, CheckCircle2, Circle, ArrowUpRight,
  Loader2, ChevronDown, ChevronUp, Users
} from 'lucide-react';
import { getTasks, getDecisions, updateTaskStatus } from '../lib/api';

interface Task {
  id: number;
  title: string;
  assigned_to: string | null;
  due_date: string | null;
  status: string;
  meeting_id: number;
  meeting_title: string;
}

interface Decision {
  id: string;
  decision: string;
  meeting_id: number;
  meeting_title: string;
  date: string;
}

interface MeetingGroup {
  meeting_id: number;
  meeting_title: string;
  tasks: Task[];
}

type TabType = 'tasks' | 'decisions';

export function Tasks() {
  const [tab, setTab] = useState<TabType>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    Promise.all([getTasks(), getDecisions()])
      .then(([tasksRes, decisionsRes]) => {
        setTasks(tasksRes.data);
        setDecisions(decisionsRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  // Grouper les tâches par réunion
  const meetingGroups: MeetingGroup[] = React.useMemo(() => {
    const map = new Map<number, MeetingGroup>();
    tasks.forEach((t) => {
      if (!map.has(t.meeting_id)) {
        map.set(t.meeting_id, {
          meeting_id: t.meeting_id,
          meeting_title: t.meeting_title,
          tasks: [],
        });
      }
      map.get(t.meeting_id)!.tasks.push(t);
    });
    return Array.from(map.values());
  }, [tasks]);

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t)
      );
    } catch {
      alert('Erreur lors de la mise à jour.');
    }
  };

  const toggleCollapse = (meetingId: number) => {
    setCollapsed((prev) => ({ ...prev, [meetingId]: !prev[meetingId] }));
  };

  const nextStatus = (current: string) => {
    if (current === 'todo') return 'in_progress';
    if (current === 'in_progress') return 'done';
    return 'todo';
  };

  const statusIcon = (status: string) => {
    if (status === 'done') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (status === 'in_progress') return <Clock className="w-5 h-5 text-[#ee3124]" />;
    return <Circle className="w-5 h-5 text-gray-300" />;
  };

  const statusBadge = (status: string) => {
    if (status === 'done') return (
      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-green-50 text-green-700 border border-green-200">Terminé</span>
    );
    if (status === 'in_progress') return (
      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#ee3124]/10 text-[#ee3124] border border-[#ee3124]/20">En cours</span>
    );
    return (
      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">À faire</span>
    );
  };

  // Stats globales
  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
    overdue: tasks.filter((t) => {
      if (!t.due_date || t.status === 'done') return false;
      return new Date(t.due_date) < new Date();
    }).length,
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
      <div>
        <h1 className="text-3xl font-bold text-black tracking-tight">
          Tâches & Décisions
        </h1>
        <p className="text-gray-500 mt-1">
          Actions et décisions extraites par l'IA, organisées par réunion.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { icon: CheckSquare, label: 'Total tâches', value: stats.total, color: 'gray' },
          { icon: Circle, label: 'À faire', value: stats.todo, color: 'gray' },
          { icon: Clock, label: 'En cours', value: stats.in_progress, color: 'red' },
          { icon: CheckCircle2, label: 'Terminées', value: stats.done, color: 'green' },
          { icon: AlertCircle, label: 'En retard', value: stats.overdue, color: 'red', valueRed: true },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
              s.color === 'red' ? 'bg-[#ee3124]/10 border border-[#ee3124]/20' :
              s.color === 'green' ? 'bg-green-50 border border-green-100' :
              'bg-gray-50 border border-gray-100'
            }`}>
              <s.icon className={`w-5 h-5 ${
                s.color === 'red' ? 'text-[#ee3124]' :
                s.color === 'green' ? 'text-green-600' :
                'text-[#333333]'
              }`} />
            </div>
            <p className="text-sm font-bold text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${(s as any).valueRed ? 'text-[#ee3124]' : 'text-black'}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {(['tasks', 'decisions'] as const).map((t) => {
            const isActive = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative py-3 flex items-center gap-2 text-sm font-bold transition-colors ${
                  isActive ? 'text-[#ee3124]' : 'text-gray-500 hover:text-[#333333]'
                }`}
              >
                {t === 'tasks' ? <CheckSquare className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                {t === 'tasks' ? "Plan d'action" : 'Décisions prises'}
                <span className={`ml-1 px-2 py-0.5 rounded-md text-xs ${
                  isActive ? 'bg-[#ee3124]/10 text-[#ee3124]' : 'bg-gray-100 text-gray-600'
                }`}>
                  {t === 'tasks' ? tasks.length : decisions.length}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="tasksTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ee3124]"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {tab === 'tasks' ? (
        /* ── Tâches groupées par réunion ── */
        <div className="space-y-4">
          {meetingGroups.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <CheckSquare className="w-10 h-10 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-black mb-1">Aucune tâche</h3>
              <p className="text-sm text-gray-500">Analysez des réunions pour générer des tâches automatiquement.</p>
            </div>
          ) : (
            meetingGroups.map((group) => {
              const isOpen = !collapsed[group.meeting_id];
              const doneTasks = group.tasks.filter((t) => t.status === 'done').length;
              const progress = Math.round((doneTasks / group.tasks.length) * 100);

              return (
                <div key={group.meeting_id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Header du groupe */}
                  <button
                    onClick={() => toggleCollapse(group.meeting_id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-[#ee3124]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <CheckSquare className="w-5 h-5 text-[#ee3124]" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <h3 className="text-sm font-bold text-black truncate">
                          {group.meeting_title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500 font-medium">
                            {group.tasks.length} tâche{group.tasks.length > 1 ? 's' : ''}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs font-bold text-green-600">
                            {doneTasks} terminée{doneTasks > 1 ? 's' : ''}
                          </span>
                          {/* Barre de progression */}
                          <div className="flex-1 max-w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-400">{progress}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <Link
                        to={`/meetings/${group.meeting_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-[#ee3124] transition-colors"
                      >
                        Voir la réunion
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                      {isOpen
                        ? <ChevronUp className="w-5 h-5 text-gray-400" />
                        : <ChevronDown className="w-5 h-5 text-gray-400" />
                      }
                    </div>
                  </button>

                  {/* Tâches du groupe */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-100"
                      >
                        <div className="divide-y divide-gray-50">
                          {group.tasks.map((task, i) => (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03 }}
                              className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors"
                            >
                              <button
                                onClick={() => handleStatusChange(task.id, nextStatus(task.status))}
                                className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform"
                                title="Changer le statut"
                              >
                                {statusIcon(task.status)}
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                  <p className={`text-sm font-bold ${
                                    task.status === 'done' ? 'text-gray-400 line-through' : 'text-black'
                                  }`}>
                                    {task.title}
                                  </p>
                                  {statusBadge(task.status)}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500 font-medium">
                                  {task.assigned_to && (
                                    <span className="flex items-center gap-1 font-bold text-[#333333]">
                                      👤 {task.assigned_to}
                                    </span>
                                  )}
                                  {task.due_date && (
                                    <>
                                      <span className="text-gray-300">•</span>
                                      <span className={`flex items-center gap-1 ${
                                        new Date(task.due_date) < new Date() && task.status !== 'done'
                                          ? 'text-[#ee3124] font-bold'
                                          : ''
                                      }`}>
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(task.due_date).toLocaleDateString('fr-FR')}
                                        {new Date(task.due_date) < new Date() && task.status !== 'done' && (
                                          <span className="ml-1">⚠</span>
                                        )}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ── Décisions ── */
        <div className="space-y-4">
          {decisions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Sparkles className="w-10 h-10 text-gray-300 mx-auto mb-4" />
              <p className="text-sm font-bold text-gray-500">
                Aucune décision — analysez des réunions pour en extraire.
              </p>
            </div>
          ) : (
            // Grouper les décisions par réunion
            Object.values(
              decisions.reduce((acc, d) => {
                if (!acc[d.meeting_id]) {
                  acc[d.meeting_id] = { meeting_id: d.meeting_id, meeting_title: d.meeting_title, date: d.date, items: [] };
                }
                acc[d.meeting_id].items.push(d);
                return acc;
              }, {} as Record<number, { meeting_id: number; meeting_title: string; date: string; items: Decision[] }>)
            ).map((group) => (
              <div key={group.meeting_id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#ee3124]/10 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[#ee3124]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-black">{group.meeting_title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(group.date).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                        {' • '}
                        {group.items.length} décision{group.items.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/meetings/${group.meeting_id}`}
                    className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-[#ee3124] transition-colors"
                  >
                    Voir la réunion
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Décisions */}
                <div className="divide-y divide-gray-50">
                  {group.items.map((d, i) => (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="px-6 py-4 flex items-start gap-3 hover:bg-gray-50 transition-colors"
                    >
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#ee3124] text-white text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-[#333333] leading-relaxed">{d.decision}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
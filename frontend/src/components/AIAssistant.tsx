import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Bot, User, Loader2, FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { sendChatMessage, ChatReference } from '../lib/api';

interface Message {
  id: number;
  role: 'ai' | 'user';
  text: string;
  references?: ChatReference[];
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'ai',
      text: "Bonjour ! Je suis l'assistant MeetSense. Posez-moi une question sur vos réunions, par exemple : « Quelle réunion parlait du déploiement des GAB ? »",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    'Quelles décisions ont été prises ?',
    'Quelle réunion parlait du déploiement des GAB ?',
    'Montre les tâches en attente.',
  ];

  // Défilement automatique vers le dernier message.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: Date.now(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(text);
      const aiMsg: Message = {
        id: Date.now() + 1,
        role: 'ai',
        text: res.data.answer,
        references: res.data.references,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'ai',
          text: "Désolé, une erreur est survenue. Réessayez dans un instant.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#ee3124] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#d42b1f] transition-colors z-40">
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Panneau latéral */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">

            {/* En-tête */}
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4 bg-[#fcfcfc]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#ee3124]/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#ee3124]" />
                </div>
                <h3 className="font-bold text-black">Assistant MeetSense</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Zone de conversation */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'ai' ? 'bg-[#333333] text-white' : 'bg-gray-100 text-[#333333]'}`}>
                    {msg.role === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[78%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-3 rounded-2xl text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#ee3124] text-white rounded-tr-none' : 'bg-gray-100 text-[#333333] rounded-tl-none'}`}>
                      {msg.text}
                    </div>

                    {/* Références cliquables vers les réunions */}
                    {msg.references && msg.references.length > 0 && (
                      <div className="w-full space-y-2">
                        {msg.references.map((ref) => (
                          <Link
                            key={ref.id}
                            to={`/meetings/${ref.id}`}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2 p-2.5 bg-white border border-gray-200 rounded-xl hover:border-[#ee3124]/40 hover:bg-[#ee3124]/5 transition-colors group">
                            <div className="w-8 h-8 rounded-lg bg-[#ee3124]/10 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-[#ee3124]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-black truncate group-hover:text-[#ee3124] transition-colors">
                                {ref.title}
                              </p>
                              {ref.date && (
                                <p className="text-[11px] text-gray-500">{formatDate(ref.date)}</p>
                              )}
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#ee3124] transition-colors flex-shrink-0" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Indicateur de chargement */}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#333333] text-white flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-3 rounded-2xl rounded-tl-none bg-gray-100 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#ee3124]" />
                    <span className="text-sm text-gray-500">Recherche dans vos réunions…</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            <div className="px-4 py-2 flex flex-wrap gap-2">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(sug)}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-[#333333] hover:border-[#ee3124] hover:text-[#ee3124] transition-colors disabled:opacity-50">
                  {sug}
                </button>
              ))}
            </div>

            {/* Zone de saisie */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                  placeholder="Posez une question sur vos réunions…"
                  disabled={loading}
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ee3124]/20 focus:border-[#ee3124] transition-all disabled:opacity-50" />
                <button
                  onClick={() => handleSend(input)}
                  disabled={loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#ee3124] hover:bg-[#ee3124]/10 rounded-lg transition-colors disabled:opacity-50">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

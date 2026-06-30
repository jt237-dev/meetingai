import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Bot, User } from 'lucide-react';
export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
  {
    id: 1,
    role: 'ai',
    text: 'Hello! I am MeetSense AI. How can I help you analyze your meetings today?'
  }]
  );
  const [input, setInput] = useState('');
  const suggestions = [
  'What decisions were taken?',
  'Who spoke the most?',
  'Show unresolved problems.'];

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [
    ...prev,
    {
      id: Date.now(),
      role: 'user',
      text
    }]
    );
    setInput('');
    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: 'ai',
        text: "Based on the recent 'Athena Project' meeting, the main decision was to push the release date to May 26 and build an API mock."
      }]
      );
    }, 1000);
  };
  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#ee3124] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#d42b1f] transition-colors z-40">
        
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Slide-in Panel */}
      <AnimatePresence>
        {isOpen &&
        <motion.div
          initial={{
            x: '100%',
            opacity: 0
          }}
          animate={{
            x: 0,
            opacity: 1
          }}
          exit={{
            x: '100%',
            opacity: 0
          }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 200
          }}
          className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
          
            {/* Header */}
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4 bg-[#fcfcfc]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#ee3124]/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#ee3124]" />
                </div>
                <h3 className="font-bold text-black">MeetSense AI</h3>
              </div>
              <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
              
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg) =>
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              
                  <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'ai' ? 'bg-[#333333] text-white' : 'bg-gray-100 text-[#333333]'}`}>
                
                    {msg.role === 'ai' ?
                <Bot className="w-4 h-4" /> :

                <User className="w-4 h-4" />
                }
                  </div>
                  <div
                className={`max-w-[75%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-[#ee3124] text-white rounded-tr-none' : 'bg-gray-100 text-[#333333] rounded-tl-none'}`}>
                
                    {msg.text}
                  </div>
                </div>
            )}
            </div>

            {/* Suggestions */}
            <div className="px-4 py-2 flex flex-wrap gap-2">
              {suggestions.map((sug, i) =>
            <button
              key={i}
              onClick={() => handleSend(sug)}
              className="text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-[#333333] hover:border-[#ee3124] hover:text-[#ee3124] transition-colors">
              
                  {sug}
                </button>
            )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="relative">
                <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                placeholder="Ask about your meetings..."
                className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ee3124]/20 focus:border-[#ee3124] transition-all" />
              
                <button
                onClick={() => handleSend(input)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#ee3124] hover:bg-[#ee3124]/10 rounded-lg transition-colors">
                
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </>);

}
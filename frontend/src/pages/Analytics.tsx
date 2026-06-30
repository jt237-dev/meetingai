import React, { Children } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Sparkles,
  Clock,
  Users,
  MessageCircle } from
'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar } from
'recharts';
import {
  ANALYTICS_MONTHLY,
  ANALYTICS_TOPICS,
  ANALYTICS_SENTIMENT,
  PARTICIPANT_STATS } from
'../lib/mockData';
const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid #e5e5e5',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  fontFamily: 'Inter',
  fontSize: '12px'
};
const axisStyle = {
  fill: '#6b7280',
  fontSize: 12,
  fontFamily: 'Inter'
};
export function Analytics() {
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    }
  };
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight">
            Analyses Avancées
          </h1>
          <p className="text-gray-500 mt-1">
            Indicateurs détaillés de performance des réunions de l'entreprise.
          </p>
        </div>
        <select className="text-sm border border-gray-200 rounded-xl bg-white px-3 py-2 text-gray-600 focus:ring-[#ee3124] focus:border-[#ee3124] font-bold">
          <option>5 derniers mois</option>
          <option>Trimestre en cours</option>
          <option>Cumul annuel</option>
        </select>
      </div>

      {/* Key Metrics Row */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#333333]" />
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
              +18 %
            </span>
          </div>
          <p className="text-sm font-bold text-gray-500">Durée moyenne</p>
          <p className="text-2xl font-bold text-black mt-1">52 min</p>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            vs 64 min le mois dernier
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-[#333333]" />
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
              +24 %
            </span>
          </div>
          <p className="text-sm font-bold text-gray-500">Décisions / réunion</p>
          <p className="text-2xl font-bold text-black mt-1">4,2</p>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            Tendance à la hausse
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#ee3124]/10 border border-[#ee3124]/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#ee3124]" />
            </div>
            <span className="text-xs font-bold text-[#ee3124] bg-[#ee3124]/10 px-2 py-1 rounded-md">
              Sujet chaud
            </span>
          </div>
          <p className="text-sm font-bold text-gray-500">
            Sujet le plus discuté
          </p>
          <p className="text-2xl font-bold text-black mt-1">Technique</p>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            32 mentions sur la période
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#333333]" />
            </div>
          </div>
          <p className="text-sm font-bold text-gray-500">
            Heures économisées par l'IA
          </p>
          <p className="text-2xl font-bold text-black mt-1">186 h</p>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            ≈ 18 600 € économisés
          </p>
        </motion.div>
      </motion.div>

      {/* Monthly Trends */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-black">
              Tendances d'activité
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Réunions, actions et décisions au fil du temps
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#333333]" />{' '}
              Réunions
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ee3124]" /> Actions
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />{' '}
              Décisions
            </span>
          </div>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={ANALYTICS_MONTHLY}
              margin={{
                top: 5,
                right: 20,
                bottom: 5,
                left: 0
              }}>
              
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e5e5e5" />
              
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={axisStyle}
                dy={10} />
              
              <YAxis axisLine={false} tickLine={false} tick={axisStyle} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="meetings"
                stroke="#333333"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: '#333333',
                  strokeWidth: 2,
                  stroke: '#fff'
                }}
                activeDot={{
                  r: 6,
                  fill: '#ee3124',
                  stroke: '#fff'
                }}
                name="Réunions" />
              
              <Line
                type="monotone"
                dataKey="actions"
                stroke="#ee3124"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: '#ee3124',
                  strokeWidth: 2,
                  stroke: '#fff'
                }}
                name="Actions" />
              
              <Line
                type="monotone"
                dataKey="decisions"
                stroke="#d1d5db"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: '#d1d5db',
                  strokeWidth: 2,
                  stroke: '#fff'
                }}
                name="Décisions" />
              
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-column charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Distribution */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-black">
              Sujets de discussion
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Thèmes détectés par l'IA sur l'ensemble des réunions
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ANALYTICS_TOPICS}
                margin={{
                  top: 5,
                  right: 20,
                  bottom: 5,
                  left: 0
                }}>
                
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e5e5" />
                
                <XAxis
                  dataKey="topic"
                  axisLine={false}
                  tickLine={false}
                  tick={axisStyle}
                  dy={10} />
                
                <YAxis axisLine={false} tickLine={false} tick={axisStyle} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{
                    fill: 'rgba(238, 49, 36, 0.05)'
                  }} />
                
                <Bar
                  dataKey="value"
                  fill="#ee3124"
                  radius={[8, 8, 0, 0]}
                  name="Mentions" />
                
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-black">
              Sentiment des réunions
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Tonalité globale détectée par l'IA
            </p>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ANALYTICS_SENTIMENT}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                  labelLine={false}
                  fontSize={11}
                  fontFamily="Inter">
                  
                  {ANALYTICS_SENTIMENT.map((entry, i) =>
                  <Cell
                    key={i}
                    fill={entry.color}
                    stroke="#fff"
                    strokeWidth={2} />

                  )}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Speaker engagement radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-black">
                Profil d'engagement
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Engagement par participant principal
              </p>
            </div>
            <Users className="w-5 h-5 text-[#333333]" />
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={PARTICIPANT_STATS.map((p) => ({
                  name: p.name.split(' ')[0],
                  engagement: p.engagement
                }))}>
                
                <PolarGrid stroke="#e5e5e5" />
                <PolarAngleAxis dataKey="name" tick={axisStyle} />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{
                    ...axisStyle,
                    fontSize: 10
                  }} />
                
                <Radar
                  name="Engagement"
                  dataKey="engagement"
                  stroke="#ee3124"
                  fill="#ee3124"
                  fillOpacity={0.3}
                  strokeWidth={2} />
                
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Highlights */}
        <div className="bg-[#0a0a0a] rounded-2xl shadow-sm p-6 text-white relative overflow-hidden border border-gray-800">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#ee3124] rounded-full opacity-20 blur-[40px] pointer-events-none" />

          <div className="flex items-center gap-2 mb-6 relative z-10">
            <Sparkles className="w-5 h-5 text-[#ee3124]" />
            <h2 className="text-lg font-bold">Faits marquants IA</h2>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-[#ee3124]" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Productivité
                </p>
              </div>
              <p className="text-sm font-bold leading-relaxed">
                Les réunions se terminant par des décisions claires ont
                progressé de <span className="text-[#ee3124]">+34 %</span> ce
                mois-ci.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-[#ee3124]" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Gain de temps
                </p>
              </div>
              <p className="text-sm font-bold leading-relaxed">
                La durée moyenne a diminué de{' '}
                <span className="text-[#ee3124]">12 min</span> — continuez sur
                cette voie.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-[#ee3124]" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Engagement
                </p>
              </div>
              <p className="text-sm font-bold leading-relaxed">
                Marie Curie a piloté 60 % des décisions techniques sur la
                période.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>);

}
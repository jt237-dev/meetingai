export const MOCK_STATS = {
  totalMeetings: 124,
  hoursSaved: 186,
  uniqueParticipants: 85,
  aiAccuracy: 99.2,
  productivityScore: 92,
  pendingActions: 14
};

export const MOCK_MEETINGS = [
{
  id: 'm1',
  title: 'Comité de pilotage Projet Athena',
  date: '2026-05-12T10:00:00Z',
  duration: 60,
  participantCount: 5,
  status: 'processed',
  project: 'Projet Athena',
  aiConfidence: 99
},
{
  id: 'm2',
  title: 'Sprint Review équipe Backend',
  date: '2026-05-11T14:30:00Z',
  duration: 45,
  participantCount: 8,
  status: 'processed',
  project: 'Core API',
  aiConfidence: 97
},
{
  id: 'm3',
  title: 'Point RH - Recrutement Q3',
  date: '2026-05-12T15:00:00Z',
  duration: 30,
  participantCount: 3,
  status: 'processing',
  project: 'Interne',
  aiConfidence: null
},
{
  id: 'm4',
  title: 'Revue commerciale Q2',
  date: '2026-05-10T09:00:00Z',
  duration: 120,
  participantCount: 12,
  status: 'processed',
  project: 'Ventes',
  aiConfidence: 95
},
{
  id: 'm5',
  title: 'Sync Hebdo Design',
  date: '2026-05-13T11:00:00Z',
  duration: 45,
  participantCount: 4,
  status: 'pending',
  project: 'Design System',
  aiConfidence: null
}];


export const DETAILED_MEETING = {
  id: 'm1',
  title: 'Comité de pilotage Projet Athena',
  date: '12 mai 2026',
  time: '10h00 - 11h00',
  duration: '60 min',
  organizer: 'Jean Dupont',
  project: 'Projet Athena',
  tags: ['Stratégie', 'Retard', 'Budget'],
  aiConfidence: 99,
  participants: [
  {
    id: 'p1',
    name: 'Jean Dupont',
    role: 'Chef de Projet',
    speakingTime: 45,
    confidence: 100,
    avatar: 'https://i.pravatar.cc/150?u=jean'
  },
  {
    id: 'p2',
    name: 'Marie Curie',
    role: 'Lead Tech',
    speakingTime: 30,
    confidence: 98,
    avatar: 'https://i.pravatar.cc/150?u=marie'
  },
  {
    id: 'p3',
    name: 'Lucas Martin',
    role: 'Product Owner',
    speakingTime: 15,
    confidence: 95,
    avatar: 'https://i.pravatar.cc/150?u=lucas'
  },
  {
    id: 'p4',
    name: 'Sophie Bernard',
    role: 'Sponsor',
    speakingTime: 10,
    confidence: 99,
    avatar: 'https://i.pravatar.cc/150?u=sophie'
  }],

  timeline: [
  { time: '10:00', type: 'intro', label: 'Introduction' },
  { time: '10:15', type: 'issue', label: 'Discussion Retard API' },
  { time: '10:35', type: 'decision', label: 'Validation Budget' },
  { time: '10:50', type: 'action', label: 'Planification Actions' }],

  summary: {
    executiveSummary:
    "La réunion a abordé un retard de 2 semaines sur la livraison du module de paiement, dû à une instabilité de l'API Stripe en environnement de test. L'équipe a convenu de construire un serveur bouchon pour débloquer la QA et a approuvé une enveloppe de 2 000 € pour les heures supplémentaires.",
    mainIssues: [
    {
      text: 'La livraison du module de paiement accuse un retard de 2 semaines.',
      confidence: 98,
      severity: 'high'
    },
    {
      text: "L'API Stripe est instable en environnement de test, bloquant les tests de bout en bout.",
      confidence: 99,
      severity: 'critical'
    }],

    objectives: [
    "Évaluer l'impact du retard sur la feuille de route globale.",
    "Trouver une solution de contournement pour débloquer l'équipe QA.",
    'Valider le budget supplémentaire pour les heures supplémentaires.'],

    decisions: [
    {
      text: 'Date de livraison officielle repoussée au 26 mai.',
      confidence: 100
    },
    {
      text: "Mise en place d'un mock API pour permettre à la QA d'avancer sur les autres scénarios.",
      confidence: 95
    },
    {
      text: "Approbation d'une enveloppe de 2 000 € pour couvrir les heures supplémentaires.",
      confidence: 99
    }],

    solutions: [
    "L'équipe backend créera un serveur bouchon (mock) d'ici vendredi.",
    "Escalade du ticket de support chez le fournisseur de l'API."],

    risks: [
    {
      text: 'La campagne marketing pourrait être lancée avant que le produit ne soit totalement stable.',
      probability: 'high'
    },
    {
      text: 'La QA pourrait passer à côté de cas limites si le mock ne reproduit pas parfaitement le comportement de Stripe.',
      probability: 'medium'
    }],

    recommendations: [
    'Planifier une synchronisation avec le Marketing demain pour aligner sur le nouveau calendrier.',
    "Affecter un ingénieur QA dédié pour tester l'intégration live une fois l'API stabilisée."]

  },
  actions: [
  {
    id: 'a1',
    task: 'Développer le mock API',
    assignee: 'Marie Curie',
    dueDate: '15 mai',
    priority: 'Haute',
    status: 'pending',
    confidence: 98
  },
  {
    id: 'a2',
    task: 'Contacter le support Stripe (Niveau 2)',
    assignee: 'Jean Dupont',
    dueDate: '13 mai',
    priority: 'Haute',
    status: 'done',
    confidence: 100
  },
  {
    id: 'a3',
    task: 'Informer le marketing du décalage',
    assignee: 'Lucas Martin',
    dueDate: '14 mai',
    priority: 'Moyenne',
    status: 'pending',
    confidence: 92
  }],

  transcript: [
  {
    time: '10:02',
    speaker: 'Jean Dupont',
    text: "Bonjour à tous. L'objectif principal aujourd'hui est de statuer sur le problème du module de paiement. Marie, peux-tu nous faire un état des lieux ?"
  },
  {
    time: '10:03',
    speaker: 'Marie Curie',
    text: "Oui. En substance, l'environnement de test de notre fournisseur est instable depuis 3 jours. Ça bloque nos tests E2E.",
    corrections: [],
    tags: ['Problème']
  },
  {
    time: '10:04',
    speaker: 'Lucas Martin',
    text: "Est-ce qu'on peut utiliser un {correction} pour avancer ?",
    corrections: [
    { original: 'moque', corrected: 'mock', reason: 'Terme technique IT' }]

  },
  {
    time: '10:04',
    speaker: 'Marie Curie',
    text: "C'est ce que je propose. On peut développer un serveur bouchon d'ici {correction}. Ça débloquera la QA.",
    corrections: [
    {
      original: 'vendredi',
      corrected: 'vendredi',
      reason: 'Confirmation de date'
    }],

    tags: ['Solution']
  },
  {
    time: '10:06',
    speaker: 'Sophie Bernard',
    text: "Quel est l'impact sur le {correction} global si on fait ça ?",
    corrections: [
    {
      original: 'budget',
      corrected: 'budget',
      reason: 'Contexte financier'
    }],

    tags: ['Risque']
  },
  {
    time: '10:07',
    speaker: 'Jean Dupont',
    text: 'Il nous faudra environ 2 000 € de plus pour couvrir le temps de développement imprévu.',
    tags: ['Décision']
  }]

};

export const PARTICIPANT_STATS = [
{
  name: 'Jean Dupont',
  role: 'Chef de Projet',
  meetings: 45,
  speakingTime: '32h',
  engagement: 88,
  avatar: 'https://i.pravatar.cc/150?u=jean',
  insight: "Pilote fréquemment les décisions et plans d'action."
},
{
  name: 'Marie Curie',
  role: 'Lead Tech',
  meetings: 38,
  speakingTime: '28h',
  engagement: 92,
  avatar: 'https://i.pravatar.cc/150?u=marie',
  insight: 'Décisionnaire sur les sujets techniques.'
},
{
  name: 'Lucas Martin',
  role: 'Product Owner',
  meetings: 42,
  speakingTime: '25h',
  engagement: 85,
  avatar: 'https://i.pravatar.cc/150?u=lucas',
  insight: "Focalisé en permanence sur l'impact utilisateur."
},
{
  name: 'Sophie Bernard',
  role: 'Sponsor',
  meetings: 12,
  speakingTime: '5h',
  engagement: 60,
  avatar: 'https://i.pravatar.cc/150?u=sophie',
  insight: 'Soulève fréquemment les risques et questions budgétaires.'
},
{
  name: 'Alex Rivera',
  role: 'Designer',
  meetings: 24,
  speakingTime: '12h',
  engagement: 75,
  avatar: 'https://i.pravatar.cc/150?u=alex',
  insight: 'Très impliqué lors des discussions UI/UX.'
}];


export const CHART_DATA = [
{ name: 'Lun', meetings: 4, actions: 12 },
{ name: 'Mar', meetings: 6, actions: 18 },
{ name: 'Mer', meetings: 5, actions: 15 },
{ name: 'Jeu', meetings: 8, actions: 24 },
{ name: 'Ven', meetings: 3, actions: 8 },
{ name: 'Sam', meetings: 0, actions: 0 },
{ name: 'Dim', meetings: 0, actions: 0 }];


export const RADAR_DATA = [
{ subject: 'Technique', A: 120, B: 110, fullMark: 150 },
{ subject: 'Stratégie', A: 98, B: 130, fullMark: 150 },
{ subject: 'Budget', A: 86, B: 130, fullMark: 150 },
{ subject: 'Opérationnel', A: 99, B: 100, fullMark: 150 },
{ subject: 'Risques', A: 85, B: 90, fullMark: 150 },
{ subject: 'Produit', A: 65, B: 85, fullMark: 150 }];


export const GLOBAL_TASKS = [
{
  id: 't1',
  task: "Développer le mock API pour l'intégration Stripe",
  assignee: 'Marie Curie',
  avatar: 'https://i.pravatar.cc/150?u=marie',
  meeting: 'Comité de pilotage Projet Athena',
  meetingId: 'm1',
  dueDate: '15 mai',
  priority: 'Haute',
  status: 'in-progress',
  tags: ['Backend', 'Athena']
},
{
  id: 't2',
  task: 'Contacter le support Stripe (Niveau 2)',
  assignee: 'Jean Dupont',
  avatar: 'https://i.pravatar.cc/150?u=jean',
  meeting: 'Comité de pilotage Projet Athena',
  meetingId: 'm1',
  dueDate: '13 mai',
  priority: 'Haute',
  status: 'done',
  tags: ['Support']
},
{
  id: 't3',
  task: 'Informer le Marketing du décalage de livraison',
  assignee: 'Lucas Martin',
  avatar: 'https://i.pravatar.cc/150?u=lucas',
  meeting: 'Comité de pilotage Projet Athena',
  meetingId: 'm1',
  dueDate: '14 mai',
  priority: 'Moyenne',
  status: 'pending',
  tags: ['Communication']
},
{
  id: 't4',
  task: 'Préparer la revue du pipeline de recrutement Q3',
  assignee: 'Sophie Bernard',
  avatar: 'https://i.pravatar.cc/150?u=sophie',
  meeting: 'Point RH - Recrutement Q3',
  meetingId: 'm3',
  dueDate: '20 mai',
  priority: 'Moyenne',
  status: 'pending',
  tags: ['RH']
},
{
  id: 't5',
  task: "Refactoriser le module d'authentification",
  assignee: 'Marie Curie',
  avatar: 'https://i.pravatar.cc/150?u=marie',
  meeting: 'Sprint Review équipe Backend',
  meetingId: 'm2',
  dueDate: '18 mai',
  priority: 'Haute',
  status: 'in-progress',
  tags: ['Backend', 'Sécurité']
},
{
  id: 't6',
  task: "Mettre à jour les maquettes du parcours d'onboarding",
  assignee: 'Alex Rivera',
  avatar: 'https://i.pravatar.cc/150?u=alex',
  meeting: 'Sync Hebdo Design',
  meetingId: 'm5',
  dueDate: '16 mai',
  priority: 'Basse',
  status: 'pending',
  tags: ['Design']
},
{
  id: 't7',
  task: 'Envoyer les prévisions du pipeline Q2 à la direction',
  assignee: 'Jean Dupont',
  avatar: 'https://i.pravatar.cc/150?u=jean',
  meeting: 'Revue commerciale Q2',
  meetingId: 'm4',
  dueDate: '12 mai',
  priority: 'Haute',
  status: 'done',
  tags: ['Ventes', 'Direction']
},
{
  id: 't8',
  task: 'Documenter les nouvelles limites de débit API',
  assignee: 'Marie Curie',
  avatar: 'https://i.pravatar.cc/150?u=marie',
  meeting: 'Sprint Review équipe Backend',
  meetingId: 'm2',
  dueDate: '22 mai',
  priority: 'Basse',
  status: 'pending',
  tags: ['Documentation']
},
{
  id: 't9',
  task: "Organiser un point avec l'équipe Marketing",
  assignee: 'Lucas Martin',
  avatar: 'https://i.pravatar.cc/150?u=lucas',
  meeting: 'Comité de pilotage Projet Athena',
  meetingId: 'm1',
  dueDate: '13 mai',
  priority: 'Moyenne',
  status: 'in-progress',
  tags: ['Communication']
}];


export const GLOBAL_DECISIONS = [
{
  id: 'd1',
  decision: 'Repousser la date de livraison au 26 mai',
  meeting: 'Comité de pilotage Projet Athena',
  meetingId: 'm1',
  date: '12 mai',
  owner: 'Jean Dupont',
  impact: 'Haut'
},
{
  id: 'd2',
  decision:
  'Approuver une enveloppe budgétaire de 2 000 € pour les heures supplémentaires',
  meeting: 'Comité de pilotage Projet Athena',
  meetingId: 'm1',
  date: '12 mai',
  owner: 'Sophie Bernard',
  impact: 'Moyen'
},
{
  id: 'd3',
  decision: "Adopter la nouvelle bibliothèque d'authentification v3",
  meeting: 'Sprint Review équipe Backend',
  meetingId: 'm2',
  date: '11 mai',
  owner: 'Marie Curie',
  impact: 'Haut'
},
{
  id: 'd4',
  decision: 'Ouvrir 3 nouveaux postes pour le Q3',
  meeting: 'Point RH - Recrutement Q3',
  meetingId: 'm3',
  date: '12 mai',
  owner: 'Sophie Bernard',
  impact: 'Moyen'
},
{
  id: 'd5',
  decision: 'Concentrer la prospection Q2 sur les comptes grands comptes',
  meeting: 'Revue commerciale Q2',
  meetingId: 'm4',
  date: '10 mai',
  owner: 'Jean Dupont',
  impact: 'Haut'
}];


export const ANALYTICS_MONTHLY = [
{ name: 'Jan', meetings: 28, actions: 84, decisions: 22 },
{ name: 'Fév', meetings: 32, actions: 96, decisions: 28 },
{ name: 'Mar', meetings: 41, actions: 122, decisions: 35 },
{ name: 'Avr', meetings: 38, actions: 110, decisions: 31 },
{ name: 'Mai', meetings: 45, actions: 138, decisions: 42 }];


export const ANALYTICS_TOPICS = [
{ topic: 'Budget', value: 28 },
{ topic: 'Feuille de route', value: 24 },
{ topic: 'Recrutement', value: 18 },
{ topic: 'Technique', value: 32 },
{ topic: 'Ventes', value: 21 },
{ topic: 'Design', value: 15 }];


export const ANALYTICS_SENTIMENT = [
{ name: 'Positif', value: 62, color: '#22c55e' },
{ name: 'Neutre', value: 28, color: '#9ca3af' },
{ name: 'Préoccupé', value: 10, color: '#ee3124' }];
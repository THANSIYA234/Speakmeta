import type { Challenge, DailyProgress, Topic, UserProfile } from '../types';

export const topics: Topic[] = [
  {
    id: 'daily-life',
    title: 'Daily life',
    description: 'Talk about your routines, hobbies and everyday moments.',
    icon: '☕',
    accent: '#7C5CFF',
    accentSoft: '#EDE7FF',
    difficulty: 'Beginner',
    durationMinutes: 5,
    prompt:
      'Describe your typical day from morning to night. Mention the food you eat, the places you visit and the people you talk to.',
    instructions: [
      'Speak naturally for at least 60 seconds.',
      'Use complete sentences and link your ideas with "because", "so" or "then".',
      'Try to include at least five new words you learned this week.',
    ],
  },
  {
    id: 'travel',
    title: 'Travel',
    description: 'Share stories about trips, flights and faraway places.',
    icon: '✈️',
    accent: '#2E9BF0',
    accentSoft: '#E4F2FE',
    difficulty: 'Intermediate',
    durationMinutes: 7,
    prompt:
      'Talk about a trip you have taken. Where did you go, who did you travel with, and what was the most memorable moment?',
    instructions: [
      'Describe the destination, the journey and the food you tried.',
      'Compare it with a place you would like to visit next.',
      'Keep speaking for at least 90 seconds without stopping.',
    ],
  },
  {
    id: 'job-interviews',
    title: 'Job interviews',
    description: 'Practise answers for common interview questions.',
    icon: '💼',
    accent: '#28B26B',
    accentSoft: '#E4F7EC',
    difficulty: 'Advanced',
    durationMinutes: 10,
    prompt:
      'Answer this interview question aloud: "Tell me about yourself and why you are a good fit for this role."',
    instructions: [
      'Use the STAR structure: situation, task, action, result.',
      'Quantify your results where you can (numbers, percentages, timelines).',
      'Speak clearly and professionally for 2 to 3 minutes.',
    ],
  },
  {
    id: 'technology',
    title: 'Technology',
    description: 'Discuss apps, gadgets and how tech changes life.',
    icon: '💻',
    accent: '#F2545B',
    accentSoft: '#FDE9EA',
    difficulty: 'Intermediate',
    durationMinutes: 7,
    prompt:
      'Explain how technology has changed the way people learn or work in your country.',
    instructions: [
      'Give one specific example of a tool you use every day.',
      'Mention one advantage and one drawback.',
      'Aim for 90 seconds of confident speech.',
    ],
  },
  {
    id: 'education',
    title: 'Education',
    description: 'Talk about school, university and learning habits.',
    icon: '🎓',
    accent: '#F5A524',
    accentSoft: '#FFF3DF',
    difficulty: 'Beginner',
    durationMinutes: 6,
    prompt:
      'Describe your education journey and the subject that interested you the most.',
    instructions: [
      'Mention where you studied and for how long.',
      'Explain what you learned beyond the syllabus.',
      'Speak for at least 60 seconds.',
    ],
  },
  {
    id: 'personal-experiences',
    title: 'Personal experiences',
    description: 'Tell a story about something that happened to you.',
    icon: '⭐',
    accent: '#B05CF0',
    accentSoft: '#F5E9FD',
    difficulty: 'Intermediate',
    durationMinutes: 8,
    prompt:
      'Tell a story about an experience that changed your mind about something. What happened, and how did you feel?',
    instructions: [
      'Set the scene: where you were, when it happened, who was there.',
      'Build a beginning, middle and end.',
      'Finish with what you learned from it.',
    ],
  },
];

export const dailyChallenge: Challenge = {
  id: 'challenge-daily-1',
  title: 'Describe your morning routine',
  topicId: 'daily-life',
  description:
    'Talk about how you start your day and what makes a morning productive.',
  prompt:
    'From the moment you wake up to the moment you leave the house, describe your morning routine step by step.',
  targetWords: 80,
  xp: 25,
};

export const dailyProgress: DailyProgress = {
  sessionsCompleted: 2,
  sessionsTarget: 3,
  minutesPracticed: 12,
  minutesTarget: 20,
  wordsSpoken: 340,
  xpEarned: 50,
  xpTarget: 100,
};

export const weekActivity = [
  { day: 'M', minutes: 15 },
  { day: 'T', minutes: 22 },
  { day: 'W', minutes: 8 },
  { day: 'T', minutes: 18 },
  { day: 'F', minutes: 26 },
  { day: 'S', minutes: 12 },
  { day: 'S', minutes: 0 },
];

export const userProfile: UserProfile = {
  name: 'Anitha Raman',
  firstName: 'Anitha',
  email: 'anitha.raman@example.com',
  level: 'Intermediate B2',
  levelProgress: 64,
  joinedSince: 'March 2025',
  avatarInitials: 'AR',
  totalSessions: 128,
  totalMinutes: 640,
  currentStreak: 7,
  longestStreak: 21,
  wordsLearned: 1840,
  skills: [
    { label: 'Fluency', value: 78 },
    { label: 'Pronunciation', value: 65 },
    { label: 'Vocabulary', value: 82 },
    { label: 'Grammar', value: 58 },
    { label: 'Confidence', value: 71 },
  ],
};

export const getTopicById = (id: string | undefined): Topic | undefined =>
  topics.find((topic) => topic.id === id);

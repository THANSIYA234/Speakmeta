export type TopicId =
  | 'daily-life'
  | 'travel'
  | 'job-interviews'
  | 'technology'
  | 'education'
  | 'personal-experiences';

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Topic {
  id: TopicId;
  title: string;
  description: string;
  icon: string;
  accent: string;
  accentSoft: string;
  difficulty: Difficulty;
  durationMinutes: number;
  prompt: string;
  instructions: string[];
}

export interface Challenge {
  id: string;
  title: string;
  topicId: TopicId;
  description: string;
  prompt: string;
  targetWords: number;
  xp: number;
}

export interface DailyProgress {
  sessionsCompleted: number;
  sessionsTarget: number;
  minutesPracticed: number;
  minutesTarget: number;
  wordsSpoken: number;
  xpEarned: number;
  xpTarget: number;
}

export interface SkillProgress {
  label: string;
  value: number;
}

/** Lifecycle of the browser audio recorder. */
export type RecorderStatus =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'paused'
  | 'recorded'
  | 'error';

/**
 * What the current browser can do.
 *
 * `insecure-context` is separate from `unsupported` on purpose: the browser
 * supports recording, but the page was served over plain HTTP, so the
 * microphone API is hidden. That needs a different message and a different
 * fix than an ancient browser.
 */
export type RecorderSupport = 'ready' | 'insecure-context' | 'unsupported';

export type RecorderErrorCode =
  | 'permission-denied'
  | 'no-device'
  | 'insecure-context'
  | 'unsupported'
  | 'recording-failed';

export interface RecorderError {
  code: RecorderErrorCode;
  message: string;
}

/**
 * A finished recording. `blob` is the audio payload that will be uploaded to the
 * backend once the speech-to-text pipeline exists.
 */
export interface VoiceRecording {
  blob: Blob;
  /** Object URL used for local playback; revoked when the recording is discarded. */
  url: string;
  mimeType: string;
  durationMs: number;
  sizeBytes: number;
  /**
   * Name the file should get when it is uploaded. Kept separate from the blob
   * so the UI can show the intended name without building the file.
   */
  fileName: string;
}

export interface UserProfile {
  name: string;
  firstName: string;
  email: string;
  level: string;
  levelProgress: number;
  joinedSince: string;
  avatarInitials: string;
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  wordsLearned: number;
  skills: SkillProgress[];
}

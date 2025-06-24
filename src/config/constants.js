export const QUESTION_STATUS = {
  WAITING: 'waiting',
  IN_PROGRESS: 'in_progress',
  PAUSED: 'paused',
  COMPLETED: 'completed',
};

export const URGENCY_LEVELS = {
  HIGH: '🔴至急',
  MEDIUM: '🟡普通',
  LOW: '🟢低め',
};

export const CATEGORIES = {
  TECHNICAL: '技術的な問題',
  DESIGN: 'デザイン・UI/UX',
  BUSINESS: 'ビジネス・企画',
  OTHER: 'その他',
};

export const CONSULTATION_TYPES = {
  SLACK: 'Slackで相談',
  ZOOM: 'Zoomで相談',
};

// デフォルト値定数
export const DEFAULT_VALUES = {
  URGENCY: URGENCY_LEVELS.MEDIUM,
  CATEGORY: CATEGORIES.TECHNICAL,
  CONSULTATION_TYPE: CONSULTATION_TYPES.SLACK,
};

export const STATUS_EMOJI = {
  [QUESTION_STATUS.WAITING]: '🟡',
  [QUESTION_STATUS.IN_PROGRESS]: '🔵',
  [QUESTION_STATUS.PAUSED]: '🟠',
  [QUESTION_STATUS.COMPLETED]: '✅',
};

export const RESERVATION_TIMES = {
  '30分後': 30,
  '1時間後': 60,
  '2時間後': 120,
  明日午前: 'tomorrow_morning',
};

export const MENTOR_AVAILABILITY = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  OFFLINE: 'offline',
};

export const TIME_SLOTS = [
  '00:00-03:00',
  '03:00-06:00',
  '06:00-09:00',
  '09:00-12:00',
  '12:00-15:00',
  '15:00-18:00',
  '18:00-21:00',
  '21:00-24:00',
];

export const MENTOR_SPECIALTIES = {
  FRONTEND: 'フロントエンド',
  BACKEND: 'バックエンド',
  DESIGN: 'デザイン・UI/UX',
  BUSINESS: 'ビジネス・企画',
  INFRASTRUCTURE: 'インフラ・デプロイ',
  MOBILE: 'モバイル開発',
  DATABASE: 'データベース',
  AI_ML: 'AI・機械学習',
  GENERAL: '全般・その他',
};

export const QUESTION_STATUS = {
  WAITING: 'waiting',
  IN_PROGRESS: 'in_progress',
  PAUSED: 'paused',
  COMPLETED: 'completed',
};

export const URGENCY_LEVELS = {
  HIGH: '🔴緊急（他の開発が止まっている）',
  MEDIUM: '🟡急ぎ（今日明日中に解決したい）',
  LOW: '🟢いつでも（時間のある時で大丈夫）',
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


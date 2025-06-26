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
  FRONTEND: 'フロントエンド',
  BACKEND: 'バックエンド',
  INFRASTRUCTURE: 'インフラ・デプロイ',
  LAYOUT_CSS: 'レイアウト・CSS',
  UI_UX: 'UI・UX相談',
  IDEA_CONSULTATION: 'アイデア相談',
  TECH_CHOICE: '技術選択相談',
  GENERAL: 'なんでも相談',
  ERROR_TROUBLE: 'エラー・トラブル',
};

export const CONSULTATION_TYPES = {
  SLACK: 'Slackで相談',
  ZOOM: 'Zoomで相談',
};

// デフォルト値定数
export const DEFAULT_VALUES = {
  URGENCY: URGENCY_LEVELS.MEDIUM,
  CATEGORY: CATEGORIES.FRONTEND,
  CONSULTATION_TYPE: CONSULTATION_TYPES.SLACK,
};

export const STATUS_EMOJI = {
  [QUESTION_STATUS.WAITING]: '🟡',
  [QUESTION_STATUS.IN_PROGRESS]: '🔵',
  [QUESTION_STATUS.PAUSED]: '🟠',
  [QUESTION_STATUS.COMPLETED]: '✅',
};

export const MENTOR_AVAILABILITY = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  OFFLINE: 'offline',
};

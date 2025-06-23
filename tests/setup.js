/**
 * Jest セットアップファイル
 */

// 環境変数のモック
process.env.SLACK_BOT_TOKEN = 'xoxb-test-token';
process.env.SLACK_SIGNING_SECRET = 'test-signing-secret';
process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
process.env.MENTOR_CHANNEL_ID = 'C1234567890';
process.env.PORT = '3000';

// グローバルモック
import { vi } from 'vitest';

global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
};

// タイムゾーンの設定
process.env.TZ = 'Asia/Tokyo';
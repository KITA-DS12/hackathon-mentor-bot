import pkg from '@slack/bolt';
const { App, ExpressReceiver } = pkg;
import { config } from './config/index.js';
import {
  handleMentorHelpCommand,
  handleMentorStatusCommand,
  handleMentorRegisterCommand,
  handleMentorListCommand,
  handleMentorQuestionsCommand,
  handleMentorUnregisterCommand,
  handleMentorHealthCommand,
} from './handlers/commands.js';
import {
  handleCategorySelectionSubmission,
  handleTemplateQuestionSubmission,
} from './handlers/template.js';
import { handleQuestionModalSubmission } from './handlers/modals.js';
import { handleMentorRegistrationSubmission } from './handlers/mentorRegistration.js';
import { handleQuestionTypeSelectionSubmission } from './handlers/questionType.js';
import {
  handleConfirmUnregisterAction,
  handleCancelUnregisterAction,
} from './handlers/mentorUnregister.js';
import {
  handleStartResponse,
  handleCheckDetails,
  handlePauseResponse,
  handleResumeResponse,
  handleReleaseAssignment,
  handleCompleteResponse,
  handleMarkResolvedByUser,
} from './handlers/actions.js';
import {
  handleStatusModalSubmission,
  handleChangeStatusAction,
} from './handlers/schedule.js';

// 環境変数チェック
if (!config.slack.botToken || !config.slack.signingSecret) {
  console.error('❌ 必要な環境変数が設定されていません:');
  console.error(
    '  SLACK_BOT_TOKEN:',
    config.slack.botToken ? '✅ 設定済み' : '❌ 未設定'
  );
  console.error(
    '  SLACK_SIGNING_SECRET:',
    config.slack.signingSecret ? '✅ 設定済み' : '❌ 未設定'
  );
  console.error('');
  console.error('🔧 環境変数を設定してください:');
  console.error('  - Cloud Console: https://console.cloud.google.com/run');
  console.error('  - または make set-env コマンドを使用');
  console.error('');

  // 環境変数が未設定でもサーバーは起動する（ヘルスチェック対応）
  console.log(
    '⚠️  環境変数が未設定ですが、サーバーを起動します（設定後に再起動してください）'
  );
}

// Expressレシーバーを明示的に作成
const receiver = new ExpressReceiver({
  signingSecret: config.slack.signingSecret || 'dummy-secret',
});

const app = new App({
  token: config.slack.botToken || 'dummy-token',
  receiver,
});

// Health check endpoint
app.receiver.router.get('/health', (req, res) => {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };

  res.status(200).json(healthData);
});

// Slash Commands
app.command('/mentor-help', handleMentorHelpCommand);
app.command('/mentor-status', handleMentorStatusCommand);
app.command('/mentor-register', handleMentorRegisterCommand);
app.command('/mentor-list', handleMentorListCommand);
app.command('/mentor-questions', handleMentorQuestionsCommand);
app.command('/mentor-unregister', handleMentorUnregisterCommand);
app.command('/mentor-health', handleMentorHealthCommand);

// Modal Submissions
app.view('question_modal', handleQuestionModalSubmission);
app.view('status_modal', handleStatusModalSubmission);
app.view('category_selection_modal', handleCategorySelectionSubmission);
app.view('template_question_modal', handleTemplateQuestionSubmission);
app.view('mentor_registration_modal', handleMentorRegistrationSubmission);
app.view(
  'question_type_selection_modal',
  handleQuestionTypeSelectionSubmission
);

// Button Actions
app.action('start_response', handleStartResponse);
app.action('check_details', handleCheckDetails);
app.action('pause_response', handlePauseResponse);
app.action('resume_response', handleResumeResponse);
app.action('release_assignment', handleReleaseAssignment);
app.action('complete_response', handleCompleteResponse);
app.action('mark_resolved_by_user', handleMarkResolvedByUser);
app.action('change_status', handleChangeStatusAction);
app.action('confirm_unregister', handleConfirmUnregisterAction);
app.action('cancel_unregister', handleCancelUnregisterAction);

// Error handling
app.error((error) => {
  console.error('Slack app error:', error);
});

(async () => {
  try {
    await app.start(config.app.port);

    // 環境変数が設定されている場合のみサービスを初期化
    if (config.slack.botToken && config.slack.signingSecret) {
      console.log('🎉 Hackathon Mentor Bot is fully initialized!');
    } else {
      console.log('⚠️  Slack認証情報が未設定のため、一部機能は無効です');
    }

    console.log('⚡️ Hackathon Mentor Bot is running!');
    console.log(`🚀 Port: ${config.app.port}`);
    console.log(
      `📡 Mentor Channel ID: ${config.app.mentorChannelId || '未設定'}`
    );

    if (!config.slack.botToken || !config.slack.signingSecret) {
      console.log('');
      console.log('🔧 次のステップ:');
      console.log('  1. 環境変数を設定: make set-env');
      console.log('  2. サービスを再起動');
    }
  } catch (error) {
    console.error('Failed to start the app:', error);
    process.exit(1);
  }
})();

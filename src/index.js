import pkg from '@slack/bolt';
const { App } = pkg;
import { config } from './config/index.js';
import {
  handleMentorHelpCommand,
  handleMentorHelpSimpleCommand,
  handleMentorStatusCommand,
  handleMentorScheduleCommand,
} from './handlers/commands.js';
import {
  handleCategorySelectionSubmission,
  handleSubcategorySelectionSubmission,
  handleTemplateQuestionSubmission,
} from './handlers/template.js';
import {
  handleQuestionModalSubmission,
  handleReservationModalSubmission,
} from './handlers/modals.js';
import {
  handleStartResponse,
  handleCheckDetails,
  handlePauseResponse,
  handleCompleteResponse,
} from './handlers/actions.js';
import {
  handleScheduleModalSubmission,
  handleStatusModalSubmission,
  handleChangeStatusAction,
} from './handlers/schedule.js';
import {
  initializeScheduler,
  handleMarkResolvedAction,
  handleSendToMentorAction,
} from './handlers/reservation.js';
import {
  initializeFollowUp,
  handleFollowUpResolvedAction,
  handleFollowUpUnresolvedAction,
} from './handlers/followup.js';

const app = new App({
  token: config.slack.botToken,
  signingSecret: config.slack.signingSecret,
  port: config.app.port,
});

// Slash Commands
app.command('/mentor-help', handleMentorHelpCommand);
app.command('/mentor-help-simple', handleMentorHelpSimpleCommand);
app.command('/mentor-status', handleMentorStatusCommand);
app.command('/mentor-schedule', handleMentorScheduleCommand);

// Modal Submissions
app.view('question_modal', handleQuestionModalSubmission);
app.view('reservation_modal', handleReservationModalSubmission);
app.view('schedule_modal', handleScheduleModalSubmission);
app.view('status_modal', handleStatusModalSubmission);
app.view('category_selection_modal', handleCategorySelectionSubmission);
app.view('subcategory_selection_modal', handleSubcategorySelectionSubmission);
app.view('template_question_modal', handleTemplateQuestionSubmission);

// Button Actions
app.action('start_response', handleStartResponse);
app.action('check_details', handleCheckDetails);
app.action('pause_response', handlePauseResponse);
app.action('complete_response', handleCompleteResponse);
app.action('change_status', handleChangeStatusAction);
app.action('mark_resolved', handleMarkResolvedAction);
app.action('send_to_mentor', handleSendToMentorAction);
app.action('followup_resolved', handleFollowUpResolvedAction);
app.action('followup_unresolved', handleFollowUpUnresolvedAction);

// Error handling
app.error((error) => {
  console.error('Slack app error:', error);
});

(async () => {
  try {
    await app.start();

    // スケジューラーサービスを初期化
    initializeScheduler(app.client);

    // フォローアップサービスを初期化
    initializeFollowUp(app.client);

    console.log('⚡️ Hackathon Mentor Bot is running!');
    console.log(`🚀 Port: ${config.app.port}`);
    console.log(`📡 Mentor Channel ID: ${config.app.mentorChannelId}`);
  } catch (error) {
    console.error('Failed to start the app:', error);
    process.exit(1);
  }
})();

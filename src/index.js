import { App } from '@slack/bolt';
import { config } from './config/index.js';
import {
  handleMentorHelpCommand,
  handleMentorStatusCommand,
  handleMentorScheduleCommand,
} from './handlers/commands.js';
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

const app = new App({
  token: config.slack.botToken,
  signingSecret: config.slack.signingSecret,
  port: config.app.port,
});

// Slash Commands
app.command('/mentor-help', handleMentorHelpCommand);
app.command('/mentor-status', handleMentorStatusCommand);
app.command('/mentor-schedule', handleMentorScheduleCommand);

// Modal Submissions
app.view('question_modal', handleQuestionModalSubmission);
app.view('reservation_modal', handleReservationModalSubmission);
app.view('schedule_modal', handleScheduleModalSubmission);
app.view('status_modal', handleStatusModalSubmission);

// Button Actions
app.action('start_response', handleStartResponse);
app.action('check_details', handleCheckDetails);
app.action('pause_response', handlePauseResponse);
app.action('complete_response', handleCompleteResponse);
app.action('change_status', handleChangeStatusAction);

// Error handling
app.error((error) => {
  console.error('Slack app error:', error);
});

(async () => {
  try {
    await app.start();
    console.log('⚡️ Hackathon Mentor Bot is running!');
    console.log(`🚀 Port: ${config.app.port}`);
    console.log(`📡 Mentor Channel ID: ${config.app.mentorChannelId}`);
  } catch (error) {
    console.error('Failed to start the app:', error);
    process.exit(1);
  }
})();

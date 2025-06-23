import { createQuestionModal } from '../utils/modal.js';

export const handleMentorHelpCommand = async ({ ack, body, client }) => {
  await ack();

  try {
    await client.views.open({
      trigger_id: body.trigger_id,
      view: createQuestionModal(),
    });
  } catch (error) {
    console.error('Error opening modal:', error);
  }
};

export const handleMentorStatusCommand = async ({ ack, say }) => {
  await ack();

  // TODO: メンター一覧とステータスを表示する機能を実装
  await say('メンターステータス機能は準備中です。');
};

export const handleMentorScheduleCommand = async ({ ack, say }) => {
  await ack();

  // TODO: メンタースケジュール管理機能を実装
  await say('メンタースケジュール機能は準備中です。');
};

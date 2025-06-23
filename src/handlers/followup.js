import { FollowUpService } from '../services/followup.js';

let followUpService;

export const initializeFollowUp = (slackClient) => {
  followUpService = new FollowUpService(slackClient);
};

export const getFollowUpService = () => {
  return followUpService;
};

export const handleFollowUpResolvedAction = async ({ ack, body, client }) => {
  await ack();

  try {
    const questionId = body.actions[0].value;
    const userId = body.user.id;

    await followUpService.markAsResolvedFromFollowUp(questionId, userId);

    // ボタンを無効化するため、メッセージを更新
    await client.chat.update({
      channel: body.channel.id,
      ts: body.message.ts,
      text: '✅ 質問を解決済みとしてマークしました。',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '✅ 質問を解決済みとしてマークしました。お疲れ様でした！',
          },
        },
      ],
    });
  } catch (error) {
    console.error('Error handling follow-up resolved action:', error);

    await client.chat.postEphemeral({
      channel: body.channel.id,
      user: body.user.id,
      text: '処理中にエラーが発生しました。',
    });
  }
};

export const handleFollowUpUnresolvedAction = async ({ ack, body, client }) => {
  await ack();

  try {
    const questionId = body.actions[0].value;
    const userId = body.user.id;

    await followUpService.handleUnresolvedFromFollowUp(questionId, userId);

    // ボタンを無効化するため、メッセージを更新
    await client.chat.update({
      channel: body.channel.id,
      ts: body.message.ts,
      text: '📝 回答を記録しました。',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '📝 回答を記録しました。引き続きサポートいたします。',
          },
        },
      ],
    });
  } catch (error) {
    console.error('Error handling follow-up unresolved action:', error);

    await client.chat.postEphemeral({
      channel: body.channel.id,
      user: body.user.id,
      text: '処理中にエラーが発生しました。',
    });
  }
};

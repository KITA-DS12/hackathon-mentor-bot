/**
 * slackUtils.js のテスト
 */
import { 
  postQuestionToMentorChannel, 
  sendUserConfirmation, 
  sendEphemeralMessage, 
  openModal, 
  updateMessage 
} from '../../src/utils/slackUtils.js';

// config をモック
jest.mock('../../src/config/index.js', () => ({
  config: {
    app: {
      mentorChannelId: 'C1234567890'
    }
  }
}));

describe('slackUtils', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      chat: {
        postMessage: jest.fn(),
        postEphemeral: jest.fn(),
        update: jest.fn()
      },
      views: {
        open: jest.fn()
      }
    };
  });

  describe('postQuestionToMentorChannel', () => {
    it('should post question to mentor channel with mention', async () => {
      const questionMessage = {
        text: '質問内容',
        blocks: [{ type: 'section', text: { type: 'mrkdwn', text: '質問内容' } }]
      };
      const mentionText = '🔔 新しい質問です\n<@U123>';

      await postQuestionToMentorChannel(mockClient, questionMessage, mentionText);

      expect(mockClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'C1234567890',
        text: '🔔 新しい質問です\n<@U123>\n\n質問内容',
        blocks: questionMessage.blocks
      });
    });
  });

  describe('sendUserConfirmation', () => {
    it('should send confirmation message to user', async () => {
      const userId = 'U123456';
      const message = '質問を送信しました。';

      await sendUserConfirmation(mockClient, userId, message);

      expect(mockClient.chat.postMessage).toHaveBeenCalledWith({
        channel: userId,
        text: message
      });
    });
  });

  describe('sendEphemeralMessage', () => {
    it('should send ephemeral message without blocks', async () => {
      const channelId = 'C123456';
      const userId = 'U123456';
      const text = 'テストメッセージ';

      await sendEphemeralMessage(mockClient, channelId, userId, text);

      expect(mockClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: channelId,
        user: userId,
        text: text
      });
    });

    it('should send ephemeral message with blocks', async () => {
      const channelId = 'C123456';
      const userId = 'U123456';
      const text = 'テストメッセージ';
      const blocks = [{ type: 'section', text: { type: 'mrkdwn', text: 'ブロック' } }];

      await sendEphemeralMessage(mockClient, channelId, userId, text, blocks);

      expect(mockClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: channelId,
        user: userId,
        text: text,
        blocks: blocks
      });
    });
  });

  describe('openModal', () => {
    it('should open modal without metadata', async () => {
      const triggerId = 'trigger123';
      const view = { type: 'modal', title: { type: 'plain_text', text: 'テスト' } };

      await openModal(mockClient, triggerId, view);

      expect(mockClient.views.open).toHaveBeenCalledWith({
        trigger_id: triggerId,
        view: view
      });
    });

    it('should open modal with metadata', async () => {
      const triggerId = 'trigger123';
      const view = { type: 'modal', title: { type: 'plain_text', text: 'テスト' } };
      const metadata = { key: 'value' };

      await openModal(mockClient, triggerId, view, metadata);

      expect(mockClient.views.open).toHaveBeenCalledWith({
        trigger_id: triggerId,
        view: {
          ...view,
          private_metadata: JSON.stringify(metadata)
        }
      });
    });
  });

  describe('updateMessage', () => {
    it('should update message without blocks', async () => {
      const channelId = 'C123456';
      const timestamp = '1234567890.123456';
      const text = '更新されたメッセージ';

      await updateMessage(mockClient, channelId, timestamp, text);

      expect(mockClient.chat.update).toHaveBeenCalledWith({
        channel: channelId,
        ts: timestamp,
        text: text
      });
    });

    it('should update message with blocks', async () => {
      const channelId = 'C123456';
      const timestamp = '1234567890.123456';
      const text = '更新されたメッセージ';
      const blocks = [{ type: 'section', text: { type: 'mrkdwn', text: 'ブロック' } }];

      await updateMessage(mockClient, channelId, timestamp, text, blocks);

      expect(mockClient.chat.update).toHaveBeenCalledWith({
        channel: channelId,
        ts: timestamp,
        text: text,
        blocks: blocks
      });
    });
  });
});
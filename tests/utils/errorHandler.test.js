/**
 * errorHandler.js のテスト
 */
import { vi } from 'vitest';
import { 
  handleSlackError, 
  withErrorHandling, 
  ERROR_MESSAGES 
} from '../../src/utils/errorHandler.js';

describe('errorHandler', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      chat: {
        postMessage: vi.fn(),
        postEphemeral: vi.fn()
      }
    };
  });

  describe('handleSlackError', () => {
    it('should send error message to user DM', async () => {
      const userId = 'U123456';
      const message = 'エラーが発生しました';

      await handleSlackError(mockClient, userId, message);

      expect(mockClient.chat.postMessage).toHaveBeenCalledWith({
        channel: userId,
        text: message
      });
    });

    it('should send error message to channel as ephemeral', async () => {
      const userId = 'U123456';
      const message = 'エラーが発生しました';
      const channelId = 'C123456';

      await handleSlackError(mockClient, userId, message, channelId);

      expect(mockClient.chat.postMessage).toHaveBeenCalledWith({
        channel: channelId,
        text: message,
        user: userId
      });
    });

    it('should handle client errors gracefully', async () => {
      mockClient.chat.postMessage.mockRejectedValue(new Error('Slack API error'));
      const userId = 'U123456';
      const message = 'エラーが発生しました';

      await handleSlackError(mockClient, userId, message);

      expect(console.error).toHaveBeenCalledWith('Failed to send error message to user:', expect.any(Error));
    });
  });

  describe('withErrorHandling', () => {
    it('should execute handler successfully', async () => {
      const mockHandler = vi.fn().mockResolvedValue('success');
      const context = { client: mockClient, userId: 'U123456' };
      const errorMessage = 'テストエラー';

      const wrappedHandler = withErrorHandling(mockHandler, context, errorMessage);
      const result = await wrappedHandler('arg1', 'arg2');

      expect(result).toBe('success');
      expect(mockHandler).toHaveBeenCalledWith('arg1', 'arg2');
      expect(mockClient.chat.postMessage).not.toHaveBeenCalled();
    });

    it('should handle errors and send error message', async () => {
      const mockHandler = vi.fn().mockRejectedValue(new Error('Test error'));
      const context = { client: mockClient, userId: 'U123456' };
      const errorMessage = 'テストエラー';

      const wrappedHandler = withErrorHandling(mockHandler, context, errorMessage);

      await expect(wrappedHandler('arg1', 'arg2')).rejects.toThrow('Test error');
      expect(mockHandler).toHaveBeenCalledWith('arg1', 'arg2');
      expect(mockClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'U123456',
        text: errorMessage
      });
      expect(console.error).toHaveBeenCalledWith('Error in spy:', expect.any(Error));
    });

    it('should handle errors without client context', async () => {
      const mockHandler = vi.fn().mockRejectedValue(new Error('Test error'));
      const context = {};
      const errorMessage = 'テストエラー';

      const wrappedHandler = withErrorHandling(mockHandler, context, errorMessage);

      await expect(wrappedHandler()).rejects.toThrow('Test error');
      expect(console.error).toHaveBeenCalledWith('Error in spy:', expect.any(Error));
      expect(mockClient.chat.postMessage).not.toHaveBeenCalled();
    });

    it('should handle errors with channel context', async () => {
      const mockHandler = vi.fn().mockRejectedValue(new Error('Test error'));
      const context = { 
        client: mockClient, 
        userId: 'U123456', 
        channelId: 'C123456' 
      };
      const errorMessage = 'テストエラー';

      const wrappedHandler = withErrorHandling(mockHandler, context, errorMessage);

      await expect(wrappedHandler()).rejects.toThrow('Test error');
      expect(mockClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'C123456',
        text: errorMessage,
        user: 'U123456'
      });
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('should contain all expected error messages', () => {
      expect(ERROR_MESSAGES.QUESTION_SUBMISSION).toBe('質問の送信中にエラーが発生しました。もう一度お試しください。');
      expect(ERROR_MESSAGES.RESERVATION_PROCESSING).toBe('予約の処理中にエラーが発生しました。もう一度お試しください。');
      expect(ERROR_MESSAGES.MENTOR_REGISTRATION).toBe('メンター登録中にエラーが発生しました。もう一度お試しください。');
      expect(ERROR_MESSAGES.STATUS_UPDATE).toBe('ステータス更新中にエラーが発生しました。もう一度お試しください。');
      expect(ERROR_MESSAGES.QUESTION_TYPE_SELECTION).toBe('質問方法の選択中にエラーが発生しました。もう一度お試しください。');
      expect(ERROR_MESSAGES.MENTOR_LIST_FETCH).toBe('メンター一覧の取得中にエラーが発生しました。');
      expect(ERROR_MESSAGES.GENERIC).toBe('処理中にエラーが発生しました。もう一度お試しください。');
    });
  });
});
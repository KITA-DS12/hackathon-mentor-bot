/**
 * エラーハンドリングユーティリティ
 */

/**
 * Slackクライアントエラーのハンドリング
 * @param {Object} client - Slackクライアント
 * @param {string} userId - ユーザーID
 * @param {string} message - エラーメッセージ
 * @param {string} channelId - チャンネルID（オプション）
 */
export const handleSlackError = async (client, userId, message, channelId = null) => {
  try {
    const channel = channelId || userId;
    const method = channelId ? 'postMessage' : 'postMessage';
    
    await client.chat[method]({
      channel,
      text: message,
      ...(channelId && { user: userId }) // Ephemeralの場合
    });
  } catch (error) {
    console.error('Failed to send error message to user:', error);
  }
};

/**
 * 統一されたエラーハンドリングラッパー
 * @param {Function} handler - 実行する非同期関数
 * @param {Object|Function} context - エラー処理のためのコンテキスト、または関数の引数からコンテキストを生成する関数
 * @param {string} errorMessage - ユーザーに表示するエラーメッセージ
 */
export const withErrorHandling = (handler, context, errorMessage) => {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error(`Error in ${handler.name}:`, error);
      
      // コンテキストが関数の場合、引数から動的に生成
      const actualContext = typeof context === 'function' ? context(args) : context;
      
      if (actualContext.client && actualContext.userId) {
        await handleSlackError(
          actualContext.client, 
          actualContext.userId, 
          errorMessage,
          actualContext.channelId
        );
      }
      
      throw error; // 必要に応じて再スロー
    }
  };
};

/**
 * 共通エラーメッセージ定数
 */
export const ERROR_MESSAGES = {
  QUESTION_SUBMISSION: '質問の送信中にエラーが発生しました。もう一度お試しください。',
  RESERVATION_PROCESSING: '予約の処理中にエラーが発生しました。もう一度お試しください。',
  MENTOR_REGISTRATION: 'メンター登録中にエラーが発生しました。もう一度お試しください。',
  STATUS_UPDATE: 'ステータス更新中にエラーが発生しました。もう一度お試しください。',
  QUESTION_TYPE_SELECTION: '質問方法の選択中にエラーが発生しました。もう一度お試しください。',
  MENTOR_LIST_FETCH: 'メンター一覧の取得中にエラーが発生しました。',
  START_RESPONSE: '対応開始の処理中にエラーが発生しました。',
  CHECK_DETAILS: '詳細確認の処理中にエラーが発生しました。',
  PAUSE_RESPONSE: '対応中断の処理中にエラーが発生しました。',
  COMPLETE_RESPONSE: '対応完了の処理中にエラーが発生しました。',
  GENERIC: '処理中にエラーが発生しました。もう一度お試しください。'
};
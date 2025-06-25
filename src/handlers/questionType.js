import { createQuestionModal } from '../utils/modal.js';
import { createCategorySelectionModal } from '../utils/template.js';
import { openModal } from '../utils/slackUtils.js';
import { withErrorHandling, ERROR_MESSAGES } from '../utils/errorHandler.js';

export const handleQuestionTypeSelectionSubmission = withErrorHandling(
  async ({ ack, body, client }) => {
    await ack();

    const values = body.view.state.values;
    const selectedType = values.question_type.type.selected_option.value;
    
    // 前のモーダルからチャンネル情報を取得
    const metadata = body.view.private_metadata ? JSON.parse(body.view.private_metadata) : {};
    const sourceChannelId = metadata.sourceChannelId;

    let nextModal;
    
    switch (selectedType) {
      case 'simple':
        // シンプル投稿 - 基本項目ありのモーダル
        nextModal = createQuestionModal(false); // freeMode = false
        break;
        
      case 'template':
        // 詳細投稿 - テンプレート選択モーダル
        nextModal = createCategorySelectionModal();
        break;
        
      default:
        // デフォルトはシンプル投稿
        nextModal = createQuestionModal(false);
    }

    // チャンネル情報を次のモーダルに引き継ぎ
    const modalMetadata = { sourceChannelId };
    await openModal(client, body.trigger_id, nextModal, modalMetadata);
  },
  (args) => ({ client: args[0].client, userId: args[0].body.user.id, channelId: null }),
  ERROR_MESSAGES.QUESTION_TYPE_SELECTION
);
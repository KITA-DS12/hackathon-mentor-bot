import { createQuestionModal } from '../utils/modal.js';
import { createCategorySelectionModal } from '../utils/template.js';
import { openModal } from '../utils/slackUtils.js';
import { withErrorHandling, ERROR_MESSAGES } from '../utils/errorHandler.js';

export const handleQuestionTypeSelectionSubmission = withErrorHandling(
  async ({ ack, body, client }) => {
    await ack();

    const values = body.view.state.values;
    const selectedType = values.question_type.type.selected_option.value;

    let nextModal;
    
    switch (selectedType) {
      case 'free':
        // 自由投稿 - 質問内容のみ必須のモーダル
        nextModal = createQuestionModal(true); // freeMode = true
        break;
        
      case 'simple':
        // シンプル投稿 - 基本項目ありのモーダル
        nextModal = createQuestionModal(false); // freeMode = false
        break;
        
      case 'template':
        // 詳細投稿 - テンプレート選択モーダル
        nextModal = createCategorySelectionModal();
        break;
        
      default:
        // デフォルトは自由投稿
        nextModal = createQuestionModal(true);
    }

    await openModal(client, body.trigger_id, nextModal);
  },
  (args) => ({ client: args[0].client, userId: args[0].body.user.id, channelId: null }),
  ERROR_MESSAGES.QUESTION_TYPE_SELECTION
);
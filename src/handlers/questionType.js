import { createQuestionModal } from '../utils/modal.js';
import { createCategorySelectionModal } from '../utils/template.js';

export const handleQuestionTypeSelectionSubmission = async ({ ack, body, client }) => {
  await ack();

  try {
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

    await client.views.open({
      trigger_id: body.trigger_id,
      view: nextModal,
    });

  } catch (error) {
    console.error('Error handling question type selection:', error);
    
    await client.chat.postMessage({
      channel: body.user.id,
      text: '質問方法の選択中にエラーが発生しました。もう一度お試しください。',
    });
  }
};
import {
  createSubcategorySelectionModal,
  createTemplateQuestionModal,
  formatTemplateQuestion,
} from '../utils/template.js';
import { FirestoreService } from '../services/firestore.js';
import { createQuestionMessage } from '../utils/message.js';
import { QUESTION_STATUS, CONSULTATION_TYPES } from '../config/constants.js';
import { config } from '../config/index.js';

const firestoreService = new FirestoreService();

export const handleCategorySelectionSubmission = async ({
  ack,
  body,
  client,
}) => {
  await ack();

  try {
    const values = body.view.state.values;
    const selectedCategory =
      values.category_selection.category.selected_option.value;

    // 前のモーダルからチャンネル情報を取得
    const metadata = body.view.private_metadata ? JSON.parse(body.view.private_metadata) : {};
    
    const modal = createSubcategorySelectionModal(selectedCategory);
    // チャンネル情報を次のモーダルに引き継ぎ
    modal.private_metadata = JSON.stringify(metadata);

    // サブカテゴリ選択モーダルを表示
    await client.views.open({
      trigger_id: body.trigger_id,
      view: modal,
    });
  } catch (error) {
    console.error('Error handling category selection:', error);

    await client.chat.postMessage({
      channel: body.user.id,
      text: 'カテゴリ選択の処理中にエラーが発生しました。もう一度お試しください。',
    });
  }
};

export const handleSubcategorySelectionSubmission = async ({
  ack,
  body,
  client,
}) => {
  await ack();

  try {
    const values = body.view.state.values;
    const metadata = JSON.parse(body.view.private_metadata);
    const selectedCategory = metadata.selectedCategory;
    const selectedSubcategory =
      values.subcategory_selection.subcategory.selected_option.value;

    const modal = createTemplateQuestionModal(selectedCategory, selectedSubcategory);
    // チャンネル情報を次のモーダルに引き継ぎ
    modal.private_metadata = JSON.stringify({
      selectedCategory,
      selectedSubcategory,
      sourceChannelId: metadata.sourceChannelId // チャンネル情報を保持
    });

    // テンプレート質問フォームを表示
    await client.views.open({
      trigger_id: body.trigger_id,
      view: modal,
    });
  } catch (error) {
    console.error('Error handling subcategory selection:', error);

    await client.chat.postMessage({
      channel: body.user.id,
      text: 'サブカテゴリ選択の処理中にエラーが発生しました。もう一度お試しください。',
    });
  }
};

export const handleTemplateQuestionSubmission = async ({
  ack,
  body,
  client,
}) => {
  await ack();

  try {
    const values = body.view.state.values;
    const metadata = JSON.parse(body.view.private_metadata);
    const { category, subcategory } = metadata;

    // フォームデータを収集
    const questionData = {
      category,
      subcategory,
      teamName: values.team_name.team_name.value,
      summary: values.question_summary.summary.value,
      urgency: values.urgency.urgency.selected_option.value,
      consultationType:
        values.consultation_type.consultation_type.selected_option.value,
      additionalInfo: values.additional_info?.additional_info?.value || '',
    };

    // テンプレートフィールドの値を収集
    Object.keys(values).forEach((blockId) => {
      if (blockId.startsWith('template_field_')) {
        const fieldId = blockId.replace('template_field_', '');
        const fieldValue = Object.values(values[blockId])[0].value;
        questionData[fieldId] = fieldValue;
      }
    });

    // 質問内容をフォーマット
    const formattedContent = formatTemplateQuestion(questionData);

    const questionRecord = {
      userId: body.user.id,
      sourceChannelId: metadata.sourceChannelId, // チャンネル情報を追加
      teamName: questionData.teamName,
      content: formattedContent,
      category: `${category} > ${subcategory}`,
      urgency: questionData.urgency,
      consultationType: questionData.consultationType,
      currentSituation: '', // テンプレートでは使用しない
      relatedLinks: '', // テンプレートでは使用しない
      errorMessage: '', // テンプレートでは使用しない
      status: QUESTION_STATUS.WAITING,
      templateData: questionData, // テンプレートデータを保存
      statusHistory: [
        {
          status: QUESTION_STATUS.WAITING,
          timestamp: new Date(),
          user: body.user.id,
        },
      ],
    };

    // 質問を処理
    const questionId = await firestoreService.createQuestion(questionRecord);

    // メンターチャンネルに質問を投稿
    const questionMessage = createQuestionMessage(questionRecord, questionId);

    await client.chat.postMessage({
      channel: config.app.mentorChannelId,
      ...questionMessage,
    });

    // 質問者にDMで確認
    await client.chat.postMessage({
      channel: body.user.id,
      text: '✅ 質問を処理しています...',
    });
  } catch (error) {
    console.error('Error handling template question submission:', error);

    await client.chat.postMessage({
      channel: body.user.id,
      text: '質問の送信中にエラーが発生しました。もう一度お試しください。',
    });
  }
};

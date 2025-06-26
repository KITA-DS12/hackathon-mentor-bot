import {
  createTemplateQuestionModal,
  formatTemplateQuestion,
} from '../utils/template.js';
import { FirestoreService } from '../services/firestore.js';
import { createQuestionMessage } from '../utils/message.js';
import { QUESTION_STATUS } from '../config/constants.js';
import { config } from '../config/index.js';
import {
  postQuestionToChannel,
  notifyMentorChannel,
} from '../utils/slackUtils.js';
import { generateMentionText } from '../utils/mentorUtils.js';

const firestoreService = new FirestoreService();

export const handleCategorySelectionSubmission = async ({
  ack,
  body,
  client,
}) => {
  try {
    const values = body.view.state.values;
    const selectedCategory =
      values.category_selection.category.selected_option.value;

    console.log('Debug: Selected category =', selectedCategory);

    // 前のモーダルからチャンネル情報を取得
    const metadata = body.view.private_metadata
      ? JSON.parse(body.view.private_metadata)
      : {};

    const modal = createTemplateQuestionModal(selectedCategory);
    // チャンネル情報を次のモーダルに引き継ぎ
    modal.private_metadata = JSON.stringify({
      ...metadata,
      category: selectedCategory,
    });

    console.log('Debug: Creating template modal for category:', selectedCategory);

    // カテゴリ選択を確認してモーダルを更新
    await ack({
      response_action: 'update',
      view: modal,
    });

    console.log('Debug: Modal updated successfully via ack');
  } catch (error) {
    console.error('Error handling category selection:', error);
    
    await ack();
    await client.chat.postMessage({
      channel: body.user.id,
      text: 'カテゴリ選択の処理中にエラーが発生しました。もう一度お試しください。',
    });
  }
};

export const handleTemplateQuestionSubmission = async ({
  ack,
  body,
  client,
}) => {
  // すぐにモーダルを閉じる（3秒以内にレスポンスが必要）
  await ack();

  // 重い処理は非同期で実行
  Promise.resolve().then(async () => {
    try {
      const values = body.view.state.values;
      const metadata = JSON.parse(body.view.private_metadata);
      const { category } = metadata;

      console.log('Debug: Form values =', JSON.stringify(values, null, 2));

      // フォームデータを収集
      const questionData = {
      category,
      teamName: values.team_name?.team_name?.value || '',
      summary: values.question_summary?.summary?.value || '',
      urgency: values.urgency?.urgency?.selected_option?.value || '',
      consultationType:
        values.consultation_type?.consultation_type?.selected_option?.value || '',
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
      category: category,
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

    // パフォーマンス測定開始
    const startTime = Date.now();
    console.log(`[${Date.now()}] Starting template question processing...`);

    // Firestoreに質問を保存
    const firestoreStart = Date.now();
    const questionId = await firestoreService.createQuestion(questionRecord);
    console.log(`[${Date.now()}] ✅ Template question saved to Firestore (${Date.now() - firestoreStart}ms) - ID: ${questionId}`);

    // 並列でメッセージ作成とメンション生成
    const [questionMessage, mentionText] = await Promise.all([
      Promise.resolve(createQuestionMessage(questionRecord, questionId)),
      generateMentionText(questionRecord.category)
    ]);

    const targetChannelId =
      questionRecord.sourceChannelId || config.app.mentorChannelId;

    let questionResult;
    let finalTargetChannelId = targetChannelId;

    try {
      questionResult = await postQuestionToChannel(
        client,
        targetChannelId,
        questionMessage,
        mentionText
      );
    } catch (error) {
      if (
        error.data?.error === 'channel_not_found' &&
        targetChannelId !== config.app.mentorChannelId
      ) {
        console.log(
          'Template: Failed to post to source channel, falling back to mentor channel...'
        );
        finalTargetChannelId = config.app.mentorChannelId;
        questionResult = await postQuestionToChannel(
          client,
          finalTargetChannelId,
          questionMessage,
          mentionText
        );
      } else {
        throw error;
      }
    }

    // 並列処理で高速化
    const parallelTasks = [];

    // Firestoreの質問データにメッセージタイムスタンプを更新
    parallelTasks.push(
      firestoreService.updateQuestion(questionId, {
        messageTs: questionResult.ts,
      })
    );

    // メンターチャンネルに投稿していない場合のみ通知を送信
    if (finalTargetChannelId !== config.app.mentorChannelId) {
      parallelTasks.push(
        notifyMentorChannel(
          client,
          questionRecord,
          questionId,
          questionResult.ts,
          mentionText
        )
      );
    }

    // 質問者にDMで確認
    parallelTasks.push(
      client.chat.postMessage({
        channel: body.user.id,
        text: '質問を送信しました。メンターからの返答をお待ちください。',
      })
    );

    // 並列実行
    const parallelStart = Date.now();
    await Promise.all(parallelTasks);
    console.log(`[${Date.now()}] ✅ Template question processing completed! Total time: ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('Error handling template question submission:', error);

      await client.chat.postMessage({
        channel: body.user.id,
        text: '質問の送信中にエラーが発生しました。もう一度お試しください。',
      });
    }
  });
};

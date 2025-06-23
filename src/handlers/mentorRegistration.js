import { FirestoreService } from '../services/firestore.js';

const firestoreService = new FirestoreService();

export const handleMentorRegistrationSubmission = async ({ ack, body, view, client }) => {
  await ack();

  try {
    const userId = body.user.id;
    const userName = body.user.username || body.user.name;
    
    // フォームデータを取得
    const values = view.state.values;
    const mentorName = values.mentor_name.name.value;
    const bio = values.mentor_bio?.bio?.value || '';
    const availability = values.initial_availability.availability.selected_option.value;

    // メンター情報をFirestoreに保存
    const mentorData = {
      userId,
      userName,
      name: mentorName,
      bio,
      availability,
      registeredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await firestoreService.createOrUpdateMentor(userId, mentorData);

    // 登録完了メッセージを送信
    const statusEmoji = availability === 'available' ? '🟢' : 
                       availability === 'busy' ? '🟡' : '🔴';

    await client.chat.postMessage({
      channel: body.user.id, // DMで通知
      text: `✅ **メンター登録が完了しました！**\n\n` +
            `👤 **名前**: ${mentorName}\n` +
            `${statusEmoji} **ステータス**: ${getStatusText(availability)}\n` +
            `${bio ? `💬 **自己紹介**: ${bio}\n` : ''}` +
            `\n質問が投稿された際にメンションを受け取ります。\n` +
            `ステータス変更は \`/mentor-status\` で行えます。`,
    });

    // チャンネルにも新規メンター登録を通知（任意）
    // await client.chat.postMessage({
    //   channel: config.app.mentorChannelId,
    //   text: `🎉 新しいメンターが登録されました！\n<@${userId}> さんが ${specialtiesText} の分野でサポートします。`,
    // });

  } catch (error) {
    console.error('Error handling mentor registration:', error);
    
    await client.chat.postMessage({
      channel: body.user.id,
      text: '❌ メンター登録中にエラーが発生しました。再度お試しください。',
    });
  }
};

function getStatusText(availability) {
  switch (availability) {
    case 'available':
      return '対応可能';
    case 'busy':
      return '忙しい';
    case 'offline':
      return '対応不可';
    default:
      return '不明';
  }
}
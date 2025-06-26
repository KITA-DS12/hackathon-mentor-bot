import { FirestoreService } from '../services/firestore.js';

const firestoreService = new FirestoreService();

export const handleConfirmUnregisterAction = async ({ ack, body, client }) => {
  await ack();

  try {
    const userId = body.actions[0].value;

    // メンター情報を取得（削除前に情報を保存）
    const mentorInfo = await firestoreService.getMentor(userId);

    if (!mentorInfo) {
      await client.chat.update({
        channel: body.channel.id,
        ts: body.message.ts,
        text: '❌ メンター情報が見つかりませんでした。',
      });
      return;
    }

    // メンター情報を削除
    await firestoreService.deleteMentor(userId);

    // 成功メッセージを表示
    await client.chat.update({
      channel: body.channel.id,
      ts: body.message.ts,
      text:
        `✅ **メンター登録を解除しました**\n\n` +
        `解除されたメンター情報:\n` +
        `👤 **名前**: ${mentorInfo.name}\n\n` +
        `今後質問が投稿されてもメンションを受け取りません。\n` +
        `再度メンターとして参加したい場合は \`/mentor-register\` で登録してください。`,
    });

    // DMで確認メッセージを送信
    await client.chat.postMessage({
      channel: userId,
      text:
        `✅ メンター登録を解除しました。\n\n` +
        `今後はメンション通知を受け取りません。\n` +
        `ご協力ありがとうございました！`,
    });
  } catch (error) {
    console.error('Error confirming mentor unregister:', error);

    await client.chat.update({
      channel: body.channel.id,
      ts: body.message.ts,
      text: '❌ メンター登録解除中にエラーが発生しました。再度お試しください。',
    });
  }
};

export const handleCancelUnregisterAction = async ({ ack, body, client }) => {
  await ack();

  try {
    await client.chat.update({
      channel: body.channel.id,
      ts: body.message.ts,
      text: '✅ メンター登録解除をキャンセルしました。\n\nメンター登録は継続されます。',
    });
  } catch (error) {
    console.error('Error canceling mentor unregister:', error);
  }
};

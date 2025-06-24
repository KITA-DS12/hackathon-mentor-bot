
export const createStatusModal = () => {
  return {
    type: 'modal',
    callback_id: 'status_modal',
    title: {
      type: 'plain_text',
      text: 'ステータス変更',
    },
    submit: {
      type: 'plain_text',
      text: '変更',
    },
    blocks: [
      {
        type: 'input',
        block_id: 'availability_status',
        element: {
          type: 'static_select',
          action_id: 'status',
          placeholder: {
            type: 'plain_text',
            text: 'ステータスを選択',
          },
          options: [
            {
              text: {
                type: 'plain_text',
                text: '🟢 対応可能',
              },
              value: 'available',
            },
            {
              text: {
                type: 'plain_text',
                text: '🔴 対応中',
              },
              value: 'busy',
            },
            {
              text: {
                type: 'plain_text',
                text: '⚫ オフライン',
              },
              value: 'offline',
            },
          ],
        },
        label: {
          type: 'plain_text',
          text: '現在のステータス',
        },
      },
    ],
  };
};

export const formatMentorStatus = (mentors) => {
  if (!mentors || mentors.length === 0) {
    return '現在登録されているメンターはいません。';
  }

  const statusEmoji = {
    available: '🟢',
    busy: '🔴',
    offline: '⚫',
  };

  const statusText = {
    available: '対応可能',
    busy: '対応中',
    offline: 'オフライン',
  };

  let message = '*メンター一覧*\n\n';

  mentors.forEach((mentor) => {
    const emoji = statusEmoji[mentor.availability] || '❓';
    const status = statusText[mentor.availability] || '不明';
    message += `${emoji} <@${mentor.userId}>: ${status}\n`;
  });

  return message;
};


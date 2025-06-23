import { TIME_SLOTS } from '../config/constants.js';

export const createScheduleModal = () => {
  const today = new Date();
  const dates = [];

  // 今日から7日間の日付を生成
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const displayStr =
      i === 0
        ? '今日'
        : i === 1
          ? '明日'
          : `${date.getMonth() + 1}/${date.getDate()}`;
    dates.push({ value: dateStr, text: displayStr });
  }

  return {
    type: 'modal',
    callback_id: 'schedule_modal',
    title: {
      type: 'plain_text',
      text: 'スケジュール設定',
    },
    submit: {
      type: 'plain_text',
      text: '設定を保存',
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '対応可能な日時を選択してください。',
        },
      },
      {
        type: 'input',
        block_id: 'schedule_date',
        element: {
          type: 'static_select',
          action_id: 'date',
          placeholder: {
            type: 'plain_text',
            text: '日付を選択',
          },
          options: dates.map((date) => ({
            text: {
              type: 'plain_text',
              text: date.text,
            },
            value: date.value,
          })),
        },
        label: {
          type: 'plain_text',
          text: '日付',
        },
      },
      {
        type: 'input',
        block_id: 'schedule_times',
        element: {
          type: 'multi_static_select',
          action_id: 'times',
          placeholder: {
            type: 'plain_text',
            text: '時間帯を選択',
          },
          options: TIME_SLOTS.map((slot) => ({
            text: {
              type: 'plain_text',
              text: slot,
            },
            value: slot,
          })),
        },
        label: {
          type: 'plain_text',
          text: '対応可能時間',
        },
      },
    ],
  };
};

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

export const formatScheduleInfo = (schedule) => {
  if (!schedule || schedule.length === 0) {
    return '今後のスケジュールはありません。';
  }

  let message = '*今後のスケジュール*\n\n';

  schedule.forEach((item) => {
    const date = new Date(item.day);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    message += `📅 ${dateStr}: ${item.timeSlots.join(', ')}\n`;
  });

  return message;
};

export * from './modal.js';
export * from './message.js';

// 一時ID生成関数
export const generateTempId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `temp_${timestamp}_${random}`;
};

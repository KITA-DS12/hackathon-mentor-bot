/**
 * 一時ID生成ユーティリティ
 * 衝突リスクを最小化するための高精度ID生成
 */

let sequenceCounter = 0;

/**
 * 衝突リスクの低い一時IDを生成
 * @returns {string} temp_で始まる一意性の高いID
 */
export function generateTempQuestionId() {
  // 高精度タイムスタンプ（ナノ秒精度）
  const hrTime = process.hrtime.bigint();
  
  // 同一ミリ秒内のシーケンス番号
  sequenceCounter = (sequenceCounter + 1) % 1000;
  
  // より長いランダム文字列（16文字で約96ビットのエントロピー）
  const randomPart = Math.random().toString(36).substring(2) + 
                     Math.random().toString(36).substring(2);
  
  // プロセスID（異なるインスタンス間での衝突回避）
  const processId = process.pid.toString(36);
  
  return `temp_${hrTime}_${sequenceCounter.toString().padStart(3, '0')}_${processId}_${randomPart}`;
}

/**
 * 一時IDかどうかを判定
 * @param {string} id 
 * @returns {boolean}
 */
export function isTempQuestionId(id) {
  return typeof id === 'string' && id.startsWith('temp_');
}
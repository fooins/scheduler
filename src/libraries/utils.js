/**
 * 生成 [min,max] 的随机整数
 * @param {integer} min 最小值（包含）
 * @param {integer} max 最大值（包含）
 * @returns {integer}
 */
const getRandomNum = (min, max) =>
  parseInt(Math.random() * (max - min + 1) + min, 10);

/**
 * 随眠指定时长
 * @param {integer} timeout 指定时长（毫秒）
 * @returns
 */
const sleep = async (timeout) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });

module.exports = {
  getRandomNum,
  sleep,
};

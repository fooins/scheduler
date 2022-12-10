const dao = require('./dao');
const { getRedis } = require('../../libraries/redis');

module.exports = async () => {
  // 查询待处理的任务
  const tasks = await dao.queryPendingTasks();

  // 更新状态为处理中
  await dao.handingTasks(tasks);

  // 发布到队列
  for (let i = 0; i < tasks.length; i += 1) {
    const { id } = tasks[i];
    await getRedis().xadd(
      'notification', // 队列名
      '*', // 表示由系统生成消息ID
      'tid', // 字段名
      id, // 字段值
    );
  }
};

const { Op } = require('sequelize');
const { getNotifyTaskModel } = require('../../models');

/**
 * 查询待处理的通知任务
 * @returns {array} 待处理的通知任务
 */
const queryPendingTasks = async () => {
  return getNotifyTaskModel().findAll({
    attributes: ['id'],
    where: {
      [Op.or]: [
        {
          status: 'pending',
        },
        {
          status: 'retry',
          retryAt: {
            [Op.lt]: Date.now(),
          },
        },
      ],
    },
    order: [['id', 'ASC']],
    limit: 1000,
  });
};

/**
 * 开始处理任务
 * @param {array} tasks 任务清单
 */
const handingTasks = async (tasks) => {
  if (!tasks || tasks.length <= 0) return;

  // 任务ID
  const taskIds = tasks.map((t) => t.id);

  // 更新任务状态为处理中
  await getNotifyTaskModel().update(
    { status: 'handing' },
    {
      where: {
        id: {
          [Op.in]: taskIds,
        },
      },
    },
  );
};

module.exports = {
  queryPendingTasks,
  handingTasks,
};

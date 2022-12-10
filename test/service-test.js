/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
const uuid = require('uuid');
const { Op } = require('sequelize');
const {
  beforeAll,
  afterAll,
  describe,
  test,
  expect,
  // eslint-disable-next-line import/no-extraneous-dependencies
} = require('@jest/globals');
const { getNotifyTaskModel } = require('../src/models');
const { getDbConnection } = require('../src/libraries/data-access');
const { getRedis } = require('../src/libraries/redis');
const { sleep } = require('../src/libraries/utils');

// 定义一个上下文变量
const ctx = {
  taskIds: [], // 产生的通知任务ID清单
  consumer: uuid.v4(), // 消费者名称
  key: 'notification', // 队列名
  group: uuid.v4(), // 消费者组名
};

/**
 * 创建依赖数据
 */
const genDependencies = async () => {
  // 创建消费者组
  try {
    await getRedis().xgroup(
      'CREATE',
      `insbiz:${ctx.key}`, // 队列名（这里需要手动加前缀）
      ctx.group, // 消费者组名
      '$', // $ 表示从尾部开始消费
      'MKSTREAM', // 队列不存在时创建队列
    );
  } catch (error) {
    // 已存在则忽略
  }
};

/**
 * 清除依赖数据
 */
const clearnDependencies = async () => {
  // 删除消费者组
  await getRedis().xgroup(
    'DESTROY',
    `insbiz:${ctx.key}`, // 队列名（这里需要手动加前缀）
    ctx.group, // 消费者组名
  );
};

/**
 * 清除产生的测试数据
 */
const clearnTestDatas = async () => {
  // 删除通知任务
  if (ctx.taskIds.length > 0) {
    await getNotifyTaskModel().destroy({
      where: {
        id: {
          [Op.in]: ctx.taskIds,
        },
      },
    });
  }
};

/**
 * 读取队列消息
 * @returns {array}
 */
const readMsgs = async () => {
  const rst = await getRedis().xreadgroup(
    'GROUP',
    ctx.group, // 消费者组名
    ctx.consumer, // 消费者名称
    'COUNT',
    1, // 获取的条数
    'STREAMS',
    ctx.key, // 队列名
    '>', // > 表示接收从未传递给任何其他消费者的消息
  );
  return rst || [];
};

// 文件内所有测试开始前执行的钩子函数
beforeAll(async () => {
  // 创建依赖数据
  await genDependencies();
});

// 文件内所有测试完成后执行的钩子函数
afterAll(async () => {
  // 清除依赖数据
  await clearnDependencies();

  // 清除产生的测试数据
  await clearnTestDatas();

  // 关闭数据库连接
  await getDbConnection().close();

  // 断开Redis连接
  await getRedis().end();
});

// 测试逻辑
describe('作业调度服务', () => {
  test('当新增了通知任务时，应接收到相应的队列消息', async () => {
    // 1. 配置
    // 构造通知任务
    const task = await getNotifyTaskModel().create({
      type: 'ClaimStatusChange',
      data: `SCHEDULER-TEST-${Date.now()}`,
      producerId: 1,
    });
    ctx.taskIds.push(task.id);

    // 2. 执行
    // 无

    // 3. 断言
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // 等待
      await sleep(1000);

      // 读取消息
      const msgGroups = await readMsgs();
      if (msgGroups.length <= 0) continue;

      // 断言第一组消息
      const [msgs] = msgGroups;
      expect(msgs).toHaveLength(2);

      // 断言队列名
      const [key, infos] = msgs;
      expect(key).toBe(`insbiz:${ctx.key}`);
      expect(infos).toHaveLength(1);

      // 断言消息格式
      const [, content] = infos[0];
      expect(content).toHaveLength(2);

      // 断言消息内容
      const [field, value] = content;
      expect(field).toBe('tid');
      expect(value).toBe(`${task.id}`);

      return;
    }
  }, 10000);
});

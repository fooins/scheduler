# Scheduler 1.0.0 发布操作<!-- omit in toc -->

- [1. 部署](#1-部署)
- [2. 回滚（若需要）](#2-回滚若需要)

## 1. 部署

1. 清理废弃的作业程序 `DELETE FROM jobs WHERE name="autoCompensate";`;

2. 设备初始化：

   - 容器服务：创建 scheduler 单实例负载（StatefulSet）。

3. 设置 GitHub 流水线[密钥信息](https://github.com/organizations/fooins/settings/secrets/actions)：

   - PROD_CONFIG_SCHEDULER: 生产环境配置。

4. 手动触发流水线 “[部署到生产环境(TKE)](https://github.com/fooins/scheduler/actions/workflows/deploy-to-prod-tke.yaml)”。

## 2. 回滚（若需要）

1. 删除 scheduler 负载（StatefulSet）。

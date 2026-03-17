# 🦞 OpenClaw Recall 🦞

**Other Language: [English](https://github.com/Felix201209/openclaw-recall/blob/main/README.md)**

**OpenClaw 的持久记忆、上下文压缩与运行状态可视化插件。🦞**

<p align="center">
  <img
    width="744"
    height="193"
    alt="OpenClaw Recall Banner"
    src="https://github.com/user-attachments/assets/deb61efe-93a8-47b3-9ae9-b5cc2c741625"
  />
</p>

当前稳定版本：**`1.3.0`** · npm 包名：**`@felixypz/openclaw-recall`**

---

## 这是什么

OpenClaw Recall 是一个专为 OpenClaw 设计的记忆基础设施插件。它解决的是 AI 编码助手**长期使用后才会暴露的问题**：

| 问题 | 解决方案 |
|---|---|
| 用户偏好在新 session 后全部丢失 | 四种记忆类型的自动写入 |
| 历史对话记录占满 prompt 预算 | 分层上下文压缩 + 预算强制限制 |
| 工具输出反复重放给模型 | 工具输出压缩，附带 Token 节省统计 |
| 记忆和 prompt 行为难以排查 | `doctor`、`status`、`memory explain`、`profile inspect` |
| 旧的噪声记忆污染召回结果 | 写入时和召回时的双重过滤 |

**支持的记忆类型：** `preference`（偏好）· `semantic`（语义）· `episodic`（情节）· `session_state`（会话状态）

---

## 1.3.0 更新了什么

本次版本聚焦于**召回质量**和**导入还原度**的提升。

**召回改进**
- 混合召回引入 RRF 融合策略，稳定偏好、项目上下文、当前任务上下文三者同时存活的概率更高
- 候选池扩展 + MMR 多样化策略，减少重复偏好占主导的召回结果
- 指令型 prompt 不再触发无意义的记忆检索
- 关系感知拼接，改善 import 或 restore 后项目/任务记忆的召回效果
- `RELEVANT MEMORY` 块内容去重更彻底，每 token 的相关性更高

**压缩改进**
- 工具输出压缩保留命令、错误堆栈、代码块、半结构化段落
- 压缩前自动解包 Provider 风格的 wrapper 层，避免压缩到 JSON 壳子而非实际内容

**导入改进**
- 超长记忆和对话段落按块导入，保留更多有效信号
- 重复行合并或覆盖，不再重复写入
- `rejectedNoise`、`rejectedSensitive`、`uncertainCandidates` 分别跟踪统计
- 普通导入不再把语义记忆静默晋升为 `shared` 类型

---

## 快速安装

```bash
npm install @felixypz/openclaw-recall
openclaw plugins install --link ./node_modules/@felixypz/openclaw-recall
openclaw-recall config init --mode local --write-openclaw
openclaw-recall doctor
```

源码安装、身份模式配置、首次使用流程 → [QUICKSTART.zh-cn.md](QUICKSTART.zh-cn.md)

---

## 文档索引

| 文件 | 内容 |
|---|---|
| [QUICKSTART.zh-cn.md](QUICKSTART.zh-cn.md) | 从安装到第一次成功召回的最短路径 |
| [OPENCLAW-INTEGRATION.zh-cn.md](OPENCLAW-INTEGRATION.zh-cn.md) | 插件集成细节与身份配置 |
| [COMPATIBILITY.md](COMPATIBILITY.md) | 已验证、已支持、部分覆盖的兼容矩阵 |
| [ARCHITECTURE.zh-cn.md](ARCHITECTURE.zh-cn.md) | 内部设计、组件概览与记忆过滤机制 |
| [OPERATIONS.zh-cn.md](OPERATIONS.zh-cn.md) | 命令行速查、配置说明、数据精度 |
| [TROUBLESHOOTING.zh-cn.md](TROUBLESHOOTING.zh-cn.md) | 已知限制与常见问题排查 |
| [CONTRIBUTING.zh-cn.md](CONTRIBUTING.zh-cn.md) | 构建、测试与贡献指南 |
| [EXAMPLES.md](EXAMPLES.md) | 可直接复制的完整操作示例 |
| [RELEASE_NOTES.md](RELEASE_NOTES.md) | 版本级更新说明 |
| [CHANGELOG.md](CHANGELOG.md) | 完整变更历史 |

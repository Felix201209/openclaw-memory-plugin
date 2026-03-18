# 故障排查

已知限制、常见问题与排查步骤。

---

## 已知限制

以下为 `1.3.2` 的已知发布限制，不影响正常使用。

- 压缩节省量和工具 token 节省量仍部分为估算值
- Provider 烟雾测试覆盖以 OpenAI Responses 路径为主
- `openclaw <subcommand>` CLI 暴露受上游限制，请直接使用 `openclaw-recall`
- 部分安装流程中 OpenClaw 可能输出 `plugins.allow is empty` 警告，属已知噪声，可忽略
- 记忆冲突解决仍为规则式（支持稳定偏好的覆盖更新，复杂冲突暂不支持语义解析）
- `reconnect` 模式使用内置 `recall-http` 后端，通用外部远程后端未经版本验证

---

## 诊断起点

遇到问题先跑这两条：

```bash
openclaw-recall doctor
openclaw-recall status
```

`doctor` 端到端检查插件健康状态。`status` 报告记忆卫生状态、最近一次 prune/reindex/compact 的时间戳，以及最近的导入统计。

---

## 记忆问题

### 跨 session 偏好没有被召回

1. 检查记忆是否已写入：`openclaw-recall memory list`
2. 检查实际会召回什么：`openclaw-recall memory explain "<你的查询>"`
3. 检查是否有噪声行压制了有效记忆：`openclaw-recall status` → 查看 `noisyActiveMemoryCount`
4. 如果噪声计数偏高：先 `openclaw-recall memory prune-noise --dry-run` 预览，再执行 `openclaw-recall memory prune-noise`

### 旧的过时记忆污染召回结果

```bash
openclaw-recall memory prune-noise --dry-run   # 预览
openclaw-recall memory prune-noise             # 执行清理
openclaw-recall memory reindex
openclaw-recall memory compact
```

### 导入后记忆信号丢失

`1.3.2` 的长文导入会对超长段落分块处理。如果信号仍然丢失：
1. `openclaw-recall import status` — 检查 `rejectedNoise` 和 `uncertainCandidates` 数量
2. 尝试用更小的源文件重新导入

---

## 安装问题

### `plugins.allow is empty` 警告

OpenClaw plugin CLI 在部分安装和 info 流程中的已知噪声，不影响功能，可忽略。

### 安装后插件未被识别

```bash
openclaw plugins info openclaw-recall
openclaw-recall config validate
openclaw-recall doctor
```

如果 `config validate` 失败，重新初始化：
```bash
openclaw-recall config init --mode local --write-openclaw
```

---

## 深度检查

在 OpenClaw 中使用检查路由进行深度排查：

```
/plugins/openclaw-recall/dashboard
/plugins/openclaw-recall/status
/plugins/openclaw-recall/memories
/plugins/openclaw-recall/sessions/:sessionId
```

或通过命令行：
```bash
openclaw-recall memory inspect <id>
openclaw-recall memory explain "<查询词>"
openclaw-recall session inspect <sessionId>
openclaw-recall profile inspect <runId>
```

# OpenClaw 集成说明

OpenClaw Recall 与 OpenClaw 的集成方式，以及身份和配置的管理。

---

## 身份模式详解

OpenClaw Recall 支持两种持久身份路径：

- `local` — 记忆保存在当前 OpenClaw 主目录，仅限本机
- `reconnect` — 通过相同的 identity key 或 memory space ID，在另一台机器或全新 OpenClaw 环境中接回同一块记忆空间

```bash
openclaw-recall config init --mode local
openclaw-recall config init --mode reconnect --identity-key recall_xxx --memory-space space_xxx
openclaw-recall config validate
```

> **安全提示：** identity key 是密钥，请存入密码管理器或其他安全存储，不要明文保存在项目文件中。

---

## 身份相关环境变量

```
OPENCLAW_RECALL_IDENTITY_MODE
OPENCLAW_RECALL_IDENTITY_KEY
OPENCLAW_RECALL_MEMORY_SPACE_ID
OPENCLAW_RECALL_IDENTITY_API_KEY
OPENCLAW_RECALL_IDENTITY_ENDPOINT
OPENCLAW_RECALL_EXPORT_DIRECTORY
```

---

## 插件注册验证

安装完成后，验证插件是否正确注册：

```bash
openclaw plugins info openclaw-recall
openclaw-recall config validate
openclaw-recall doctor
```

部分安装和 info 流程中 OpenClaw 可能输出 `plugins.allow is empty` 警告，属已知噪声，不影响功能。

---

## 跨机器连续性（reconnect 模式）

`reconnect` 模式使用内置的 `recall-http` 后端。通用外部远程后端在 `1.3.2` 中未经验证。

跨机器迁移步骤：
1. 从原机器导出 identity key
2. 安全存储该 key
3. 在新机器上执行：`openclaw-recall config init --mode reconnect --identity-key <key> --memory-space <id>`

---

## 插件内检查路由

在 OpenClaw 中可访问以下检查页面：

```
/plugins/openclaw-recall/dashboard
/plugins/openclaw-recall/status
/plugins/openclaw-recall/memories
/plugins/openclaw-recall/profiles
/plugins/openclaw-recall/sessions
/plugins/openclaw-recall/sessions/:sessionId
```

这是插件检查界面，不是替代 UI。

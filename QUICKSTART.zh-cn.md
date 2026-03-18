# 快速上手

从安装到第一次成功召回，10 分钟以内搞定。

---

## 安装

### 通过 npm 安装

```bash
npm install @felixypz/openclaw-recall
openclaw plugins install --link ./node_modules/@felixypz/openclaw-recall
openclaw-recall config init --mode local --write-openclaw
openclaw plugins info openclaw-recall
openclaw-recall config validate
openclaw-recall doctor
openclaw-recall status
```

### 从源码安装

```bash
git clone https://github.com/Felix201209/openclaw-recall.git
cd openclaw-recall
npm install && npm run build
openclaw plugins install --link .
openclaw-recall config init --mode local --write-openclaw
openclaw plugins info openclaw-recall
openclaw-recall config validate
openclaw-recall doctor
openclaw-recall status
```

---

## 身份模式

| 模式 | 适用场景 |
|---|---|
| `local` | 仅在当前机器上保留持久记忆 |
| `reconnect` | 在换机器或全新 OpenClaw 环境中接回同一块记忆空间 |

```bash
# 本地模式
openclaw-recall config init --mode local

# 重连模式
openclaw-recall config init --mode reconnect --identity-key recall_xxx --memory-space space_xxx

openclaw-recall config validate
```

> **安全提示：** identity key 是密钥，请存入密码管理器，不要明文保存在项目里。

---

## 推荐首次使用流程

1. 安装插件
2. 初始化配置（`local` 或 `reconnect`）
3. 执行 `openclaw-recall import dry-run`（预演，不实际写入）
4. 执行 `openclaw-recall import run`
5. 用 `doctor` · `status` · `memory explain` · `profile inspect` 验证

如果你已经有历史对话记录或记忆文件，直接导入比从头演示更快看到效果。

`1.3.2` 导入行为说明：
- 重复行合并或覆盖，不再重复写入
- `rejectedNoise`、`rejectedSensitive`、`uncertainCandidates` 分别跟踪统计
- 普通导入不再把语义记忆静默晋升为 `shared` 类型
- 导出的插件数据重新导入时保留原始 scope 元数据

---

## 5 分钟上手验证

**第一步：写入一条偏好**
```
记住我喜欢你叫我 Felix。
```

**第二步：开新 session 验证记忆是否保留**
```
你还记得我的偏好吗？
```

**第三步：触发一次工具输出**
```
read "README.md"
```

**第四步：检查结果**
```bash
openclaw-recall memory list
openclaw-recall memory explain "你还记得我的偏好吗？"
openclaw-recall profile list
openclaw-recall session inspect <sessionId>
```

**成功标志：**
- 记忆列表里出现 `Felix`、`中文`、`简洁` 等相关行
- 新 session 无需重放历史对话即可正确召回
- 工具结果显示 `savedTokens > 0`
- profile 行包含压缩证据

完整可复制的操作流程见 [EXAMPLES.md](EXAMPLES.md)。

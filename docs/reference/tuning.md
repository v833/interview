# 调参速查

按症状查表。改的都是 `config.yaml`（界面上「设置」里能改的项优先用界面改）。

## 回答太慢

| 症状 | 改哪里 |
|---|---|
| 回答太慢 | 先看 `llm.thinking`——设成 `off` 关掉思考，实测总耗时从 3.8~9.0s 降到 1.3~1.8s；再考虑 `asr.provider` 换成 `xfyun` |
| 还想更快 | `asr.model` 降到 `base`；`audio.end_silence_ms` 降到 400 |
| 首字慢（第一次提问） | 冷启动约 4.2 秒（import + 建客户端 + DNS/TLS）。程序会在窗口构造时后台预热，**别在预热完成前抢着提问** |

::: tip 冷启动那 4 秒是怎么来的
| 环节 | 耗时 |
|---|---|
| `import openai` | 1.68s |
| 构造 `OpenAI()` 客户端 | 0.74s |
| 首个请求的 DNS + TLS + 建连 | 2.09s |
| **合计** | **≈ 4.2s** |

预热让「首字」从 3.27s 降到 0.62s。第二个请求复用连接只要 0.25 秒。
:::

## 识别不准

| 症状 | 改哪里 |
|---|---|
| 识别不准 | `asr.provider` 换成 `xfyun`；或 `asr.model` 升到 `medium`，并在 `asr.initial_prompt` 里加上你行业的术语 |
| 句子被切碎 | `audio.end_silence_ms` 提到 900 |
| 环境噪音误触发 | `audio.min_rms` 提到 0.006 |
| 抢麦干扰识别 | **用耳机，别用外放**——否则你说的话也会被 loopback 抓进去 |
| 按住说话把面试官的话也录进去了 | 麦克风收到了扬声器的声音。戴耳机，或把系统音量降低 |

## 该答的不答 / 不该答的乱答

| 症状 | 改哪里 |
|---|---|
| 该回答的没回答 | `question.threshold` 降到 2.0；或直接按 <kbd>N</kbd>（问最近）手动触发 |
| 不该回答的乱回答 | `question.threshold` 提到 4.0 |
| 一句话被拆成两半判断 | `question.merge_gap_ms` 调大 |

## 回答内容不对

| 症状 | 改哪里 |
|---|---|
| 回答太长 | `llm.max_chars` 降到 150 |
| 回答被截断 / 是空的 | 先确认 `llm.thinking: off`。开着思考时思维链会占用 `llm.max_tokens`，2000 可能被吃光导致正文为空；确认关掉后还有问题再调大 `llm.max_tokens` |
| 回答像通用套话 | **填 `llm.resume`**。这是提升幅度最大的一项 |
| 回答没对准岗位 | 填 `llm.jd` |
| 上下文串味 | `llm.history_rounds` 降到 2 |

::: danger 关掉思考后正文还是空的？
`finish_reason=length` + HTTP 200 看起来像「调用成功但没回答」。
思维链 token 计入输出侧，会吃掉 `max_tokens`——实测 `max_tokens=800` 时
四条面试题里**三条正文是空的**。关掉思考后这个问题自然消失。
:::

## 网络 / 接口报错

| 症状 | 改哪里 |
|---|---|
| 换网关后报 400 | 新网关不认 `thinking` 字段，把 `llm.thinking` 改成 `auto` |
| 报 403 Your request was blocked | 部分网关拦截 OpenAI SDK 的 `User-Agent`。改 `app/llm.py` 里的 `USER_AGENT` 常量 |
| 截图提问报不支持图片 | 换多模态模型（`deepseek-flash` 已验证），纯文本模型不支持 |

## 设备相关

| 症状 | 改哪里 |
|---|---|
| 完全听不到声音 | 跑 `run.py --test-audio` 找出真正在出声的设备，把 id 填进 `audio.device` |
| 按住说话提示「打开麦克风失败」 | 麦克风被别的程序占了，或在设置里换一个「麦克风（按住说话）」设备。`audio.mic_device` 留空 = 系统默认输入设备 |
| 想换回离线识别 | `asr.provider` 改成 `local`（两个引擎可以都配好，随时切） |

## 讯飞相关

| 症状 | 改哪里 |
|---|---|
| 讯飞报 60 秒超时 | `audio.max_speech_ms` 不要超过 58000 |
| 凭证填错 | 报错会翻译成人话（APIKey 不存在 / APISecret 填错 / 服务未开通 / 超时），按提示改 |
| 免费额度用尽 | 需要到讯飞控制台充值，或切回 `local` |

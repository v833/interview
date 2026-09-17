# 配置项速查

配置文件是项目根目录的 `config.yaml`。首次运行会从 `config.example.yaml` 自动复制一份。

::: tip 三层优先级
**默认值 ← config.yaml ← 环境变量**

环境变量优先级最高。所以 CI 或者临时切换时不用改文件。
:::

界面上「设置」里能改的项，保存后写回 `config.yaml`。改完想生效，
部分项需要重启程序。

---

## audio — 采集与断句

| 键 | 默认值 | 说明 |
|---|---|---|
| `device` | `""` | 采集设备。留空 = **自动探测**在出声的那个 loopback 设备 |
| `mic_device` | `""` | 「按住说话」用的麦克风。留空 = 系统默认输入设备 |
| `samplerate` | `0` | `0` = 自动（优先 16k，失败退回设备原生采样率） |
| `block_ms` | `30` | 每次读取的音频块长度 |
| `noise_ratio` | `2.6` | 音量超过噪声底多少倍判定为人声 |
| `min_rms` | `0.0035` | 人声绝对音量下限，防止噪声底过低导致误触发 |
| `start_ms` | `120` | 连续多久有人声才算一句话开始 |
| `end_silence_ms` | `600` | 静音持续多久判定一句话结束 |
| `min_speech_ms` | `400` | 短于此长度的片段直接丢弃（咳嗽、键盘声） |
| `max_speech_ms` | `20000` | 超长强制切句。**用讯飞时别超过 58000**（单次会话上限 60 秒） |
| `preroll_ms` | `200` | 向前多留一点，避免吃掉句首 |

::: warning `device` 和 `mic_device` 是两类设备
- `device` 抓的是**系统输出**（面试官的声音）
- `mic_device` 抓的是**麦克风**（你的声音）

混了就会把面试官的话当成你问的问题。
:::

---

## asr — 语音识别

| 键 | 默认值 | 说明 |
|---|---|---|
| `provider` | `auto` | `auto` / `xfyun` / `local` |
| `xfyun.app_id` | `""` | 讯飞 APPID |
| `xfyun.api_key` | `""` | 讯飞 APIKey |
| `xfyun.api_secret` | `""` | 讯飞 APISecret |
| `xfyun.endpoint` | `wss://iat-api.xfyun.cn/v2/iat` | 讯飞 WebSocket 地址 |
| `xfyun.language` | `zh_cn` | `zh_cn` / `en_us` |
| `xfyun.domain` | `iat` | `iat` = 日常用语；医疗等场景可换 |
| `xfyun.accent` | `mandarin` | `mandarin` / `cantonese` |
| `xfyun.frame_interval_ms` | `0` | 帧间隔。**0 = 全速发送，推荐** |
| `xfyun.timeout` | `15` | 握手/会话超时秒数 |
| `model` | `small` | `tiny` / `base` / `small` / `medium` / `large-v3`，也可直接填本地目录路径 |
| `language` | `zh` | `zh` / `en` / `auto` |
| `compute_type` | `int8` | CPU 用 `int8`；有 N 卡可改 `float16` |
| `beam_size` | `1` | 越大越准越慢 |
| `cpu_threads` | `0` | `0` = 自动 |
| `initial_prompt` | 见文件 | 提示词。**加上你行业的术语能明显提准** |
| `hf_endpoint` | `https://hf-mirror.com` | 模型下载镜像，能直连 HF 可改回官方 |

### provider 三个取值的区别

| 值 | 行为 |
|---|---|
| `auto` | 讯飞三件套填齐就走讯飞，否则本地 whisper |
| `xfyun` | 强制讯飞（需填 app_id / api_key / api_secret） |
| `local` | 强制本地 faster-whisper |

### 为什么 frame_interval_ms 默认是 0

官方文档建议「每 40ms 发送 1280 字节」，那是给**实时流**的建议。
我们拿到的已经是**完整的音频段**，再按 40ms 一帧帧发，等于自己把音频重新
「实时播放」一遍。

实测 26.4 秒音频（识别文字三者完全一致）：

| 发送间隔 | 总耗时 | 倍速 |
|---|---|---|
| **0ms（全速）** | **1.2s** | **20x 实时** |
| 5ms | 4.0s | 6.5x |
| 40ms | 27.3s | 0.95x |

40ms 那一档几乎全是在等自己发完，服务端其实只要 0.26 秒就出结果。
更糟的是它会造成**积压**：20 秒的语音段要 20 秒才处理完，期间新音频不断产生，
队列很快就满、开始丢段。

---

## question — 提问判定

| 键 | 默认值 | 说明 |
|---|---|---|
| `min_chars` | `5` | 短于此长度的句子不判定为问题 |
| `threshold` | `3.0` | 疑问句得分阈值，**调高更保守**（更少误触发） |
| `merge_gap_ms` | `1200` | 两段话间隔小于此时长则合并成一句再判断 |
| `recent_count` | `3` | 「问最近」拼接末尾几条字幕，可选 1–8 |
| `auto_answer` | `true` | `false` 则只提示需手动触发，不自动作答 |

---

## llm — 大模型

| 键 | 默认值 | 说明 |
|---|---|---|
| `base_url` | `https://api.deepseek.com` | 任何 OpenAI 兼容接口都能接 |
| `api_key` | `""` | 也可用环境变量 `OPENAI_API_KEY` / `DEEPSEEK_API_KEY` |
| `model` | `deepseek-chat` | 截图提问需多模态模型（`deepseek-flash` 已验证） |
| `temperature` | `0.4` | |
| `max_tokens` | `2000` | 输出上限 |
| `thinking` | `off` | `off` / `auto` / `low` / `medium` / `high` / `max` |
| `max_chars` | `260` | 期望回答字数上限（写进提示词约束） |
| `timeout` | `60` | |
| `style` | 见文件 | 回答风格提示词 |
| `resume` | `""` | **你的简历，越具体回答越贴合** |
| `jd` | `""` | 目标岗位 JD，用来对齐回答重点 |
| `history_rounds` | `4` | 携带最近几轮问答作为上下文 |

### thinking 取值

| 值 | 行为 |
|---|---|
| `off` | **关闭思考（最快，面试推荐）** |
| `auto` | 不干预，用服务端默认（开启，强度 high） |
| `low` / `medium` / `high` / `max` | 开启思考并指定强度 |

::: warning 换网关后可能报 400
`thinking` 是 DeepSeek 的原生字段，部分第三方网关不认。报 400 就改回 `auto`。
:::

---

## ui — 界面

| 键 | 默认值 | 说明 |
|---|---|---|
| `width` / `height` | `480` / `620` | 初始尺寸（运行时会记住你的调整） |
| `opacity` | `0.95` | 窗口不透明度 |
| `font_size` | `14` | |
| `theme` | `dark` | `dark` / `light` |
| `exclude_from_capture` | `true` | **关键：共享屏幕时对方看不到本窗口** |
| `always_on_top` | `true` | 置顶 |
| `hotkey_toggle` | `ctrl+alt+h` | 显示 / 隐藏 |
| `hotkey_answer` | `n` | 把最近字幕当问题提问 |
| `hotkey_clear` | `m` | 清空字幕和回答 |
| `hotkey_screenshot` | `j` | 框选截图并自动提问 |
| `hotkey_talk` | `space` | 按住说话，松开结束 |
| `hotkey_listen` | `b` | 开始 / 停止监听 |

**留空 = 禁用该快捷键。**

---

## 环境变量

| 变量 | 覆盖的配置项 |
|---|---|
| `OPENAI_API_KEY` / `DEEPSEEK_API_KEY` | `llm.api_key`（前者优先） |
| `INTERVIEW_LLM_BASE_URL` | `llm.base_url` |
| `INTERVIEW_LLM_MODEL` | `llm.model` |
| `INTERVIEW_ASR_MODEL` | `asr.model` |
| `HF_ENDPOINT` | `asr.hf_endpoint` |
| `XFYUN_APP_ID` | `asr.xfyun.app_id` |
| `XFYUN_API_KEY` | `asr.xfyun.api_key` |
| `XFYUN_API_SECRET` | `asr.xfyun.api_secret` |

下一步 → [调参速查](./tuning.md)

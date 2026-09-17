# 工程笔记

实现过程中踩过的坑，都已解决。留着是因为**很多「奇怪现象」的成因就在里面**——
排查问题前先扫一眼，可能省半小时。

## 音频采集

### 默认扬声器是显示器，抓不到声音

这台机器的默认播放设备是 `PHL 273V7 (HD Audio Driver for Display Audio)`（一台显示器），
实际声音从 `Headphone (Realtek(R) Audio)` 出。抓默认扬声器的 loopback 会一直是静音。

**解决**：加了自动探测——启动时逐个试听所有 loopback 设备，锁定真正在出声的那个；
运行 12 秒还没声音会明确提示。

### 麦克风和 loopback 是两类设备

「开始监听」抓的是 **loopback**（系统输出，面试官的声音）；
「按住说话」要的是**麦克风**（你自己的声音）。

两者在 `soundcard` 里是不同 API：`all_microphones(include_loopback=True)`
会把 loopback 设备一起列出来，用它去选「输入设备」很容易选错。

**解决**：按住说话单独走 `all_microphones(include_loopback=False)` /
`default_microphone()`（`app/audio.py` 的 `list_microphones()` / `resolve_microphone()`），
并且在假声卡的测试里断言 `include_loopback` 必须是 `False`——
哪天代码退化成拿 loopback，测试直接炸。

好处是两条链路用的是不同设备，可以同时开着互不干扰。

---

## 模型下载

### huggingface_hub 的 Xet 协议在镜像站卡死

实测 **16 分钟只下了 17KB**。关掉 Xet 后同样的文件 **0.9 秒**下完。

**解决**：干脆不用 huggingface_hub，改成直接 HTTP 下载，顺便能给用户真实进度条。

### Windows 上创建软链接失败（WinError 14007）

huggingface_hub 用软链接把缓存文件链到目标目录，失败后小文件落地成 0 字节，
导致模型加载报 JSON 解析错误。

**解决**：直接下载成真实文件，没有软链接，问题消失。

---

## 网络与接口

### 部分网关会拦截 OpenAI SDK 的 User-Agent

某些兼容网关会对 `User-Agent: OpenAI/Python x.y.z` 直接返回
`403 Your request was blocked.`，而 curl 或换掉 UA 就正常。

单独带 `X-Stainless-*` 系列 header 不会被拦，**只有那个 UA 字符串是触发条件**。

**解决**：创建客户端时用 `default_headers={"User-Agent": "interview-copilot/0.1"}` 覆盖。

**排查手法**：用 curl 逐个 header 二分——先测基线，再加 User-Agent，再加 X-Stainless。

### 思考模式必须用 thinking，不是 reasoning_effort

官方给 `reasoning_effort` 定义的取值只有 `low/medium/high/max`，**没有「关闭」这一档**
（Responses API 才用 `reasoning.effort="none"` 关）。

而且 `thinking` **必须放进 `extra_body`**：直接当顶层参数传给 SDK 会被丢掉，
因为 SDK 的 `create()` 签名里没有这个字段，传了直接 `TypeError`。

**解决**：统一走 `app/llm.py` 的 `_thinking_kwargs()`，
用本地假服务端抓过实际请求体，确认落点是顶层 `thinking`、没有 `extra_body` 那层壳。

---

## 讯飞

### 凭证填错时只报一坨原始握手报文

凭证不对时服务端在 WebSocket 握手阶段就返回 401，
`websocket-client` 抛出的是：

```
Handshake status 401 Unauthorized -+-+- {...} -+-+-
{"message":"HMAC signature cannot be verified: apikey not found"}
```

对用户毫无帮助。

**解决**：按服务端返回的关键字翻译成人话（APIKey 不存在 / APISecret 填错 /
服务未开通 / 超时），同时保留原始信息便于排查。

> 顺带一提，这个报错本身也是个有用的信号：它说明服务端**已经成功解析了我们的
> HMAC 签名**，走到了「查这个 Key 存不存在」这一步——签名格式是对的。

### 单次会话 60 秒上限，且 10 秒不发数据会被断开

每帧 40ms、按官方建议的 1280 字节切帧发送，正常不会触发。
但如果把 `audio.max_speech_ms` 调得比 58000 还大，就会撞上 60 秒限制。

**解决**：在识别前检查时长，超限时直接给出「请把 `audio.max_speech_ms` 调到 58000 以内」，
而不是让服务端返回一个看不懂的错误码。

### 按官方建议的 40ms 发帧，结果比本地识别还慢

官方文档说「每 40ms 发送 1280 字节」，那是给**实时流**的建议——
实时场景下音频本来就是按 40ms 一块块产生的。但我们拿到的已经是**完整的音频段**，
再按 40ms 一帧帧发，等于自己把音频重新「实时播放」一遍。

实测 26.4 秒音频（识别文字三者完全一致）：

| 发送间隔 | 总耗时 | 倍速 |
|---|---|---|
| **0ms（全速）** | **1.2s** | **20x 实时** |
| 5ms | 4.0s | 6.5x |
| 40ms | 27.3s | 0.95x |

40ms 那一档几乎全是在等自己发完，服务端其实只要 0.26 秒就出结果。
更糟的是它会造成**积压**：一个 20 秒的语音段要 20 秒才处理完，
期间新音频不断产生，队列很快就满、开始丢段。

**解决**：`asr.xfyun.frame_interval_ms` 默认改成 **0（全速发送）**。

> 顺带踩到一个 Python 小陷阱：原本写的是
> `float(x.get("frame_interval_ms") or 40)`，而 **`0` 是 falsy**，
> 于是「全速」这个值被静默替换成了 40——测出来「0ms 和 40ms 一样慢」，
> 差点把结论搞反。改成显式判断 `None`。

---

## 线程与生命周期

### 手动提问点了没反应

两个叠加的原因：

**一是作答线程的生命周期绑错了。** `Answerer` 原本只在「开始监听」里创建，
作答线程也跟着采集链路一起起停。于是没点开始监听（或停掉之后）点手动提问，
只会在状态栏留下一行
`生成回答失败：'NoneType' object has no attribute 'stream'`——
字很小，很容易被当成「没反应」。

**解决**：作答**完全不依赖声卡**，就让它独立起来——`ask()` 会确保 `Answerer` 存在、
作答线程活着。

**二是首次调用把重活留在了里面。** `from openai import OpenAI` 是懒加载的，
加上客户端构造接近 1 秒，全发生在第一次提问的那一刻——用户点完按钮一两秒毫无动静。

**解决**：起作答线程时先 `warmup()` 预热掉（没配 Key 就静默跳过）。
另外提问后立刻在回答区显示「正在生成…」，别让空白区域看起来像卡死。

### stop() 不能把作答线程一起停掉

作答线程是独立于采集链路的（`_ensure_answer_worker()`），`stop()` 只停
audio / asr 两个线程。这不是疏漏，是**必需的**：一旦作答线程跟着 `stop()` 死掉，
「停止监听」之后打字提问、按住说话、问最近**全都用不了**。

真正负责收线程的是窗口退出时调的 `shutdown()`。

> 对应的测试也踩过一次：断言写成「`stop()` 后作答线程已退出」，
> 测出来的其实是错的行为。改成「`stop()` 后作答线程仍然活着 +
> `shutdown()` 后必须退出」。

---

## 性能

### 预热只建客户端是不够的，而且不能在 UI 线程上做

冷启动的固定开销实测如下（同一台机器，连 `api.deepseek.com`）：

| 环节 | 耗时 |
|---|---|
| `import openai` | 1.68s |
| 构造 `OpenAI()` 客户端 | 0.74s |
| 首个请求的 DNS + TLS + 建连 | 2.09s |
| **合计** | **≈ 4.2s** |

两个坑叠在一起：

**一是 `warmup()` 只构造了客户端，没有建立连接。**
首个真实请求仍要额外付 2.09 秒做 DNS+TLS（第二个请求复用连接只要 0.25 秒）。
→ 让 `warmup()` 真发一个 `max_tokens=1` 的最小请求，把连接也建起来。

**二是它被放在 UI 线程上同步调用。** 点「开始监听」或第一次「提问此句」
会卡住界面好几秒。→ 改成窗口构造时丢到后台线程（`Pipeline.prewarm()`），
用户还在拖窗口、选设备的时候就已经热好了；`_ensure_answer_worker()`
里不再做同步预热。

子进程 A/B（同一个进程里 `import openai` 是共享的，测不出差异）：
**不预热首字 3.27s → 预热后 0.62s，省 2.64 秒**。

> 另外 `start()` 里原本会 `Answerer(cfg)` 重建实例——那会把预热好的连接池丢掉，
> 白热一次。现在统一走 `_ensure_answerer()` 复用。

---

## 测试

### 异步测试必须先把事件队列排空再断言

两个坑连在一起：

**一是「点一下立刻读标签」测的是竞态。** `_test_xfyun()` 在后台线程里验证，
结果通过 Qt 信号回主线程；`VoiceInput` 的状态事件也从队列里来。
不 `processEvents()` 转几圈，读到的还是「正在测试…」「正在听…」这类中间态。
→ 统一写成 `wait_for(pred)` 轮询，别用固定 `sleep`。

**二是绕过 `start()` 直接调内部循环，错误会被「代数」闸门吃掉。**
`_fail_generation()` 开头有一道 `if self._stop is not stop: return`——
旧一代线程的迟到错误不许影响新一代。测试如果直接起一个
`threading.Thread(target=pipe._asr_loop, args=(stop,))` 却不设
`pipe._stop = stop`，报出来的错误会被这道闸门丢弃，于是「初始化失败」
看起来像「什么都没发生」。
→ 测试要模拟真实调用路径（或者像 `start()` 那样把 `_stop` 补上）。

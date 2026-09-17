# 安装

## 环境要求

| 项 | 要求 |
|---|---|
| 系统 | **Windows 10 2004 或更高**（依赖 WASAPI loopback 与防截屏 API） |
| Python | 3.10+（实测 3.13 可用） |
| 硬件 | 有麦克风和扬声器即可。用本地 whisper 时建议 8GB 以上内存 |
| 网络 | 用讯飞引擎或调用大模型时需要联网 |

::: warning 只支持 Windows
采集靠 WASAPI loopback，防截屏靠 Win32 的 `SetWindowDisplayAffinity`，
两者都没有跨平台替代方案。macOS / Linux 上跑不起来。
:::

## 1. 建虚拟环境并装依赖

在项目根目录执行：

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

依赖一共 9 个包，其中三个值得单独说一句：

| 包 | 作用 |
|---|---|
| `soundcard` | WASAPI loopback 采集，**不用装虚拟声卡** |
| `PyQt6` | 悬浮窗界面 |
| `pywin32` | 防截屏用的 Win32 API |
| `keyboard` | 全局快捷键（**可选**，装不上不影响主流程） |
| `faster-whisper` | 本地离线识别（用讯飞的话其实用不到） |

## 2. 启动

**日常启动**：双击项目根目录的 `start.bat`（不弹控制台窗口）。

命令行启动：

```powershell
.\.venv\Scripts\python.exe run.py
```

首次运行会自动把 `config.example.yaml` 复制成 `config.yaml`。
`config.yaml` 已被 `.gitignore` 忽略，可以放心往里填 Key。

## 3. 验证装对了

```powershell
.\.venv\Scripts\python.exe run.py --check
```

这一步不是走过场，详见[首次配置](./quickstart.md)。

## 目录结构

```
interview/
├── run.py                  启动入口
├── config.example.yaml     配置模板（首次运行会复制成 config.yaml）
├── requirements.txt
├── models/                 下载的语音模型（自动生成）
├── start.bat               双击启动
└── app/
    ├── config.py           默认值 <- yaml <- 环境变量
    ├── audio.py            WASAPI loopback 采集 + 自动探测在出声的设备
    ├── segmenter.py        能量型 VAD，流式断句
    ├── model_store.py      直接 HTTP 下载模型
    ├── asr.py              faster-whisper 封装 + 幻觉过滤 + 引擎选择工厂
    ├── asr_xfyun.py        讯飞语音听写 WebAPI（HMAC 签名 / 分帧 / 分片合并）
    ├── question.py         提问判定规则打分
    ├── llm.py              DeepSeek 流式作答
    ├── pipeline.py         三线程编排 + 事件队列
    ├── voice_input.py      「按住说话」：麦克风录音 -> 识别 -> 填回输入框
    ├── ui.py               PyQt6 悬浮窗 + 防截屏 + 全局热键
    └── main.py             参数解析 / 自检
```

下一步 → [首次配置](./quickstart.md)

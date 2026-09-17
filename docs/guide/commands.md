# 命令行

所有命令都通过 `run.py` 进入。虚拟环境里的 python 路径写全更稳妥：

```powershell
.\.venv\Scripts\python.exe run.py <参数>
```

## 参数一览

| 命令 | 作用 |
|---|---|
| `run.py` | 启动界面 |
| `run.py --check` | 环境自检：依赖、设备、麦克风、语音引擎，并**真实调用一次大模型** |
| `run.py --ask "问题"` | 不开界面，直接试答一个问题（验证 Key 和回答风格） |
| `run.py --test-audio` | 逐个试听音频设备，找出真正在出声的那个（默认每设备 3 秒） |
| `run.py --test-audio 5` | 同上，每个设备听 5 秒 |
| `run.py --selftest` | 断句 + 提问判定的规则自检（不碰网络和设备） |
| `run.py --list-devices` | 列出音频设备，拿 id 填到 `config.yaml` 的 `audio.device` |
| `run.py --config my.yaml` | 用指定配置文件启动 |

## 什么时候用哪个

**装完第一次**：

```powershell
run.py --check
run.py --test-audio
```

确认「大模型实际调用成功」和「声音在这里」都出现了，再开界面。

**改了 Key / 换了网关**：

```powershell
run.py --ask "请用一句话介绍你自己"
```

不看界面就能验证接口通不通、回答风格对不对。

**面试前**：按顺序跑一遍 `--check` 和 `--test-audio`。

**调了断句参数觉得不对**：

```powershell
run.py --selftest
```

只跑规则层，秒出结果，不占用声卡。

::: tip --test-audio 的秒数
`--test-audio` 后面可以跟一个秒数，表示每个设备试听多久，默认 3 秒。
设备多的时候给 2 秒就够，想听清楚就给 5 秒。
:::

下一步 → [配置项速查](../reference/config.md)

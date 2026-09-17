---
layout: home

hero:
  name: 侧耳
  text: 面试副驾
  tagline: 实时听懂面试官的问题，把可以直接照着念的回答推到你的悬浮窗里。不用虚拟声卡，共享屏幕时对方也看不见。
  image:
    src: /logo.svg
    alt: 侧耳 Sotto
  actions:
    - theme: brand
      text: 3 分钟跑起来
      link: /guide/quickstart
    - theme: alt
      text: 它是什么
      link: /guide/
    - theme: alt
      text: 常见问题
      link: /faq

features:
  - icon: 🎧
    title: 不用虚拟声卡
    details: 直接走 WASAPI loopback 抓系统输出，装完就能听。不用装虚拟声卡，也不用开立体声混音。
  - icon: 🫥
    title: 共享屏幕看不见
    details: 窗口用 SetWindowDisplayAffinity 排除在屏幕捕获之外。开着腾讯会议共享，对方视角里没有它。
  - icon: 🔀
    title: 云端 / 离线双引擎
    details: 填了讯飞凭证走云端，免下模型、延迟低；没填自动回退本地 whisper，断网也能用。
  - icon: ⚡
    title: 面试官换题就重答
    details: 检测到新问题立刻取消正在生成的旧回答——面试官不会等你把上一题说完。
  - icon: 🎯
    title: 五种提问方式
    details: 自动判定、按住说话、打字提问、点单句字幕、框选截图，临场怎么方便怎么来。
  - icon: 📄
    title: 简历 + JD 上下文
    details: 把简历和目标岗位喂进去，回答用的是你自己的项目细节，而不是通用套话。
---

## 它怎么工作

```
扬声器输出（腾讯会议里面试官的声音）
        │  WASAPI loopback 采集，无需虚拟声卡
        ▼
   能量型 VAD 断句（静音 0.6s 判定一句说完）
        ▼
   语音识别（讯飞流式听写 / 本地 faster-whisper，二选一）
        ▼
   规则打分判断是不是提问（疑问词 / 祈使句 / 问号 / 语气词）
        ▼
   DeepSeek 流式生成回答（带上你的简历和 JD 做上下文）
        ▼
   置顶悬浮窗，边生成边显示
```

三条常驻线程用队列解耦：**采集永不阻塞**，识别与作答分开。
作答链路完全不依赖声卡，所以停掉监听之后照样能打字提问。

<p style="display:flex;gap:12px;flex-wrap:wrap;margin:28px 0 8px">
  <a href="/guide/quickstart" style="display:inline-block;padding:9px 20px;border-radius:20px;background:var(--vp-c-brand-1);color:#fff;font-size:14px;font-weight:600;text-decoration:none">开始安装</a>
  <a href="/reference/tuning" style="display:inline-block;padding:9px 20px;border-radius:20px;border:1px solid var(--vp-c-divider);background:var(--vp-c-bg-soft);color:var(--vp-c-text-1);font-size:14px;font-weight:600;text-decoration:none">回答太慢 / 不准怎么办</a>
</p>

## 一句话说清边界

侧耳是**提词器**，不是替你思考的东西。它帮你把已经会的东西组织成能说出口的话；
简历里没写过的技术，它不会替你编——那是设计上的约束，不是缺陷。

是否在真实面试中使用，请自行判断并遵守面试方的规则与相关约定。

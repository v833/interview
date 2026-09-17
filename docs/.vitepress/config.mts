import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: '侧耳',
  titleTemplate: ':title | 侧耳 Sotto',
  description:
    '侧耳 Sotto —— 面试副驾。实时抓取会议里面试官的声音，本地识别成文字，交给大模型流式作答，在置顶悬浮窗里直接照着念。',
  base: '/',
  // VitePress 默认把 http://localhost 判为死链，构建会直接失败
  ignoreDeadLinks: [/^https?:\/\/localhost/, /^https?:\/\/127\.0\.0\.1/],
  // 保持默认的 .html 后缀链接，python -m http.server 可直接服务
  cleanUrls: false,
  lastUpdated: true,
  head: [
    ['meta', { name: 'theme-color', content: '#2f6f8f' }],
    ['meta', { property: 'og:title', content: '侧耳 Sotto · 面试副驾' }],
    [
      'meta',
      {
        property: 'og:description',
        content: '实时听懂面试官的问题，把可以直接念出来的回答推到你的悬浮窗里。'
      }
    ]
  ],

  themeConfig: {
    siteTitle: '侧耳 Sotto',
    logo: '/logo.svg',

    nav: [
      { text: '快速开始', link: '/guide/quickstart' },
      { text: '使用手册', link: '/guide/usage' },
      { text: '配置参考', link: '/reference/config' },
      { text: '常见问题', link: '/faq' }
    ],

    sidebar: [
      {
        text: '开始使用',
        items: [
          { text: '它是什么', link: '/guide/' },
          { text: '安装', link: '/guide/install' },
          { text: '首次配置', link: '/guide/quickstart' }
        ]
      },
      {
        text: '使用手册',
        items: [
          { text: '界面与操作', link: '/guide/usage' },
          { text: '五种提问方式', link: '/guide/ask' },
          { text: '按住说话', link: '/guide/voice-input' },
          { text: '命令行', link: '/guide/commands' }
        ]
      },
      {
        text: '参考',
        items: [
          { text: '配置项速查', link: '/reference/config' },
          { text: '调参速查', link: '/reference/tuning' },
          { text: '已知限制', link: '/reference/limits' }
        ]
      },
      {
        text: '其他',
        items: [
          { text: '常见问题', link: '/faq' },
          { text: '工程笔记', link: '/notes' }
        ]
      }
    ],

    outline: { level: [2, 3], label: '本页目录' },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '目录',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: {
      text: '最后更新于',
      formatOptions: { dateStyle: 'short', timeStyle: 'short' }
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            noResultsText: '没有找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
          }
        }
      }
    },

    footer: {
      message: '本工具仅用于辅助整理思路和模拟练习，使用前请确认符合面试方的规则与相关约定。',
      copyright: '侧耳 Sotto · Interview Copilot'
    }
  }
})

# Vercel 部署

## 导入 GitHub

仓库：`yimingcheng-cc/ai-pet-companion`，分支：`main`。

1. 在 Vercel 点击 Add New → Project，导入该 GitHub 仓库。
2. Framework Preset：Next.js；Root Directory：仓库根目录 `.`。
3. Node.js：24.x（package.json 已固定该主版本）。
4. 安装 `npm ci`，构建 `npm run build`，Output Directory 使用 Next.js 默认值，不填写 `out` 或 `dist`。
5. 可以先不设置任何环境变量，部署并检查页面、领养、语言切换与本地照料状态。
6. 需要真实 AI 时再在 Settings → Environment Variables 配置下表，选择需要的 Production / Preview 环境并 Redeploy。
7. 在网站设置页输入 APP_ACCESS_TOKEN 对应的访问口令。OpenAI Key 不应填入网页。

当前仓库没有 Vercel 项目 ID、Vercel token 或真实 API Key。本轮只做部署准备，不代表已完成云端部署。

## 环境变量

| 变量                            | 何时需要                                               | 留空时的实际表现                                                               |
| ------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `OPENAI_API_KEY`                | 开启真实文字/实时语音时                                | 页面、领养、本地互动正常；聊天返回明确的未配置提示，无假回复；语音不申请麦克风 |
| `APP_ACCESS_TOKEN`              | 生产环境开启 AI 时必须同时配置，建议至少 32 位随机字符 | 无 Key 的页面体验不受影响；有 Key 时拒绝付费 AI 接口，提示配置访问保护         |
| `OPENAI_TEXT_MODEL`             | 可选                                                   | 使用 `gpt-4.1-mini`，账户需有权限和额度                                        |
| `OPENAI_REALTIME_MODEL`         | 可选                                                   | 使用 `gpt-realtime-2.1`，账户需有权限和额度                                    |
| `NEXT_PUBLIC_PET_MODEL_URL`     | 接入合法 GLB/glTF 时可选，在构建前设置                 | 使用明确标注的本地真实摄影原型；没有身体动画                                   |
| `NEXT_PUBLIC_SUPABASE_URL`      | 本版不使用，可留空                                     | 浏览器本地存储，界面明确提示未接入云同步                                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 本版不使用，可留空                                     | 同上；填写这两项也不会自动获得账户或云同步                                     |

Vercel 自动设置 NODE_ENV，不要手动添加。不要把 OPENAI_API_KEY、APP_ACCESS_TOKEN 或数据库 service role key 命名为 NEXT_PUBLIC_。
本版不需要 SUPABASE_SERVICE_ROLE_KEY，也不应为未实现的功能添加真实数据库管理密钥。

## 兼容性

- 使用 Next.js App Router 默认 Vercel 构建，不采用静态导出或自定义 HTTP server。
- AI 和语音 SDP 路由显式使用 Node.js runtime；最长执行时间分别为 60 / 30 秒。
- 不在构建阶段初始化需要 Key 的 SDK 或连接数据库，所有配置在接口调用时检查。
- 默认图片随仓库部署，不依赖运行时远程图片主机或需要认证的素材 CDN。
- API Key 只在服务器端使用；真实语音媒体通过浏览器 WebRTC 连接服务商，不通过 Serverless 函数持续转发。
- 界面偏好和宠物/对话使用浏览器存储，因此线上域名与 localhost 的存档不共享，可在设置导出本地数据。
- 当前只有私有体验访问口令，没有多用户账户。单实例内存限流不能提供 Vercel 多实例全局用量保障；公众开放 AI 前仍需登录、所有权校验和共享限流。

## 部署后验收

- 打开 `/`、`/adopt`、`/pet`、`/memories`、`/settings`，刷新不应出现 404。
- 切换 EN / 中文，刷新并切换页面；检查界面语言和对话语言独立保存。
- 无 Key 时发送文字、点击麦克风，检查明确提示和无假回复。
- 配置 Key 和访问口令后验证真实中文、英文流式对话及中途停止、重试。
- 通过 HTTPS 验证真实麦克风权限、音频播放、VAD 打断和会话结束清理。
- Supabase Auth、跨设备数据同步和真实写实动画尚未完成，不作为部署成功的默认功能。

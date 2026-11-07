# Companion · AI Pet Companion

基于 Product & Development Specification V1.0 的 Phase 1 / Phase 2 实现。
使用 Next.js App Router、React、TypeScript、Tailwind CSS、OpenAI SDK 与 React Three Fiber。

这是可运行的本地应用和真实服务接入代码。当前环境未配置 OpenAI Key，未完成真实模型对话和语音验收。
宠物默认采用明确标注的金毛摄影原型；照片不是可运动的写实 3D 动物。

## 本地运行

需要 Node.js 24.x 和 npm（本次使用 24.22.1；已与 Vercel 配置对齐）。

```bash
npm ci
cp .env.example .env.local
# 编辑 .env.local，填入服务器端 OPENAI_API_KEY
npm run dev
```

打开终端显示的地址（通常 http://localhost:3000）。从首页进入领养，为宠物命名后进入 `/pet`。
没有 Key 时仍可使用领养、照料状态、设置和本地记忆管理；聊天会如实提示服务未配置。
不要把 Key 填入聊天、前端代码、NEXT_PUBLIC_ 变量或访问口令框。

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

## 当前功能与边界

| 功能                                       | 实现状态                                                                                                        |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| 首页 / 领养 / 宠物 / 记忆 / 设置           | 已实现响应式页面及导航                                                                                          |
| 金毛领养、名字、四种性格、两种实时语音选择 | 已实现，刷新后恢复本地资料                                                                                      |
| 真实宠物视觉                               | 已包含本地摄影；非卡通，明确标注视觉原型                                                                        |
| 文字聊天                                   | 后端真实调用 OpenAI Responses API；结构化流式文字解码；需要 Key，未做真实服务验收                               |
| 对话反应                                   | 模型输出受限动作和情绪；校验后进入行为系统；照片只有轻微缩放/亮度反馈及状态文字                                 |
| GLB/glTF 渲染                              | 已接入 R3F 模型加载、动画检测与交叉淡入；需要合法模型；缺失动画如实显示                                         |
| 同页语音入口                               | 已实现权限申请、WebRTC SDP 后端交换、声音播放、字幕事件、静音、停止、取消、连接错误和超时清理；未做真实服务验收 |
| 文字与语音上下文                           | 共用本地记录、宠物资料和启用的记忆；每次建立语音会话注入最近上下文，语音转录写入同一记录                        |
| 文字与语音同时使用                         | 同页保留两个入口；发送文字时结束当前语音会话，避免上下文分叉；不是并发双通道会话                                |
| 语音动作                                   | 已有倾听/说话事件状态；未实现语义动作 tool calling 或嘴型同步                                                   |
| 文字回复朗读                               | 可选择浏览器 speechSynthesis，与 OpenAI 实时语音区分；效果取决于设备声音                                        |
| 喂食 / 抚摸 / 玩耍                         | 更新并保存状态，提供可见反馈；未实现走向碗、吃饭、捡球等身体动作                                                |
| 自主作息                                   | 本地定时状态机，考虑精力、性格和交互间隔；不调用 LLM，不惩罚离线                                                |
| 对话保存                                   | 当前浏览器最近 500 条，最多 30 条有效消息进入模型上下文                                                         |
| 长期记忆                                   | 用户主动输入并确认；可查看、删除、关闭使用；最多 100 条，近期最多 12 条进入上下文；尚无自动提取与语义检索       |
| Supabase                                   | 提供 8 张表、索引、组合外键和 RLS 的迁移基础；未连接、未应用、未验收                                            |
| 登录 / 多用户隔离 / 跨设备同步             | 未实现；不能仅配置数据库变量就获得这些功能                                                                      |

未来的猫和兔仅以文字提示呈现，不伪装为可领养选项。

## 环境变量

见 `.env.example`：

- `OPENAI_API_KEY`：服务器端 API Key，文字与语音均需要；账户须有对应模型权限和额度。
- `OPENAI_TEXT_MODEL`：默认 `gpt-4.1-mini`，必须支持 Responses API 与 JSON Schema Structured Outputs。
- `OPENAI_REALTIME_MODEL`：默认 `gpt-realtime-2.1`，以当前账户可用模型为准。
- `APP_ACCESS_TOKEN`：私有部署访问保护。生产环境开启 AI 时强制配置；只浏览无 Key 的网站时可留空，建议至少 32 位随机字符。访客在设置页输入相同口令，仅保存在当前标签页 sessionStorage。此口令不是 OpenAI Key，也不是用户登录系统。
- `NEXT_PUBLIC_PET_MODEL_URL`：可选。指向你有商业使用许可的 GLB/glTF；未设置时使用摄影原型。
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`：仅预留；本版应用没有连接数据库。

## AI 与语音架构

`POST /api/chat` 校验输入，使用服务器端官方 OpenAI SDK、Responses API、`store:false` 和 JSON Schema。
逐块提取 `reply`，通过 NDJSON 发送增量；完整结束后验证动作和情绪。失败或不完整回复不会标记成功。
动作由白名单约束，模型不能写数据库字段或执行任意操作。照料状态通过本地确定性规则更新。

`POST /api/voice/session` 采用官方 WebRTC unified interface：浏览器生成 SDP，服务器以 multipart 表单请求
`https://api.openai.com/v1/realtime/calls`，返回 SDP answer。长期 Key 始终留在服务器。
麦克风只在用户点击入口后申请。页面卸载和停止时关闭 tracks、data channel、peer connection 和待处理请求。
浏览器需要 HTTPS 或 localhost。转录可能在连接建立后延迟出现；断线后用户可手动重连。

文字与语音都使用 `src/lib/ai/personality.ts` 的身份及性格规则。浏览器保存的对话、状态、记忆属于用户可修改的数据，
不会被当作可信系统命令。语音上下文通过服务端 instructions 中的数据段注入；尚无服务端会话同步或 sideband 校验。

参考官方文档（2026-11-07 检查）：

- https://developers.openai.com/api/docs/guides/streaming-responses
- https://developers.openai.com/api/docs/guides/voice-webrtc
- https://developers.openai.com/api/docs/guides/realtime-conversations

## 数据与访问

本版使用 localStorage，不会自动上传到数据库。不要将同一个浏览器档案当作多人账户系统。
设置页支持导出 JSON、清空对话、删除全部本地数据；本地删除不等同于删除上游服务的日志。
发送消息会将最近上下文、宠物状态和已启用的手动记忆发送至 OpenAI。记忆使用默认关闭。

AI 接口检查同源 Origin、限制请求体大小、使用 Zod 校验、设置超时并提供取消路径。
生产模式配置了 OpenAI Key 但没有 `APP_ACCESS_TOKEN` 时拒绝 AI 调用；没有 Key 的应用仍可正常打开并提示设置服务。内存限流为单进程全局每分钟 20 次，适用于本地和私有体验；
Vercel 多实例限流不是全局保障。面向公众发布前必须接入认证、服务端所有权检查和共享限流/用量控制。

`supabase/migrations/202611070001_initial.sql` 是 Phase 5 的起点。后续需实现 Supabase Auth、profile 初始化、
受会话保护的数据服务、本地数据迁移、每次写入的所有权检查和两账户 RLS 集成测试。
组合外键用于防止给自己的记录关联他人的 pet / conversation，但迁移尚未在实际数据库执行。

## 3D 素材

见 `public/models/golden-retriever/README.md`，包含坐标、尺寸、动画命名和许可要求。
没有内置 GLB、骨骼重定向、程序化动物动作、路径规划、音量驱动下颌或精确口型。
只有模型实际包含的动画才会播放；缺失动作会标记，加载失败则返回摄影原型。

摄影：`public/images/golden-retriever.jpg` 来自 Unsplash，图片标识 `photo-1552053831-71594a27632d`。
来源：https://images.unsplash.com/photo-1552053831-71594a27632d
许可：https://unsplash.com/license （允许商业使用，非 Unsplash+ 素材）。
图片作为界面背景整合，不作为独立素材销售。实际展示场景为户外摄影，居家 3D 环境尚待素材接入。

## V1.1 中英文切换

顶部 EN / 中文开关和设置页均可切换界面语言，并在当前浏览器保存。首页、领养、宠物、记忆、设置、错误/未配置提示和无障碍标签提供中英文本地化。界面语言与对话语言独立；后者支持自动跟随输入、中文、English，已进入文字和语音的共同身份指令。已有对话、宠物名字和记忆不会被自动翻译。

详细验收约束见 [V1.1 语言设计](docs/V1.1-language.md)。

## Vercel 私有体验部署

完整步骤、环境变量矩阵和上线边界见 [Vercel 部署说明](docs/VERCEL.md)。

1. 把项目推送到你的 Git 仓库，在 Vercel 导入；框架选择 Next.js。
2. 可以先不填任何环境变量部署界面。要开启真实 AI，再配置服务器端 `OPENAI_API_KEY` 和强随机的 `APP_ACCESS_TOKEN`；模型变量可选。
3. 如有合法模型，放入 `public/models/` 并在构建前设置 `NEXT_PUBLIC_PET_MODEL_URL`。
4. 构建命令 `npm run build`，使用 Next.js 默认输出配置，不做 static export。
5. 部署后在设置页输入访问口令。使用 HTTPS，在真实浏览器测试麦克风、打断和音频自动播放。
6. Supabase 连接、账户体系和跨设备同步需要后续实现，不能把预留变量视为已接入。

本次未执行云部署。

## 后续优先事项

- 配置 Key 后验收中英文真实流式回复、性格差异、模型动作与错误恢复。
- 已用 Chromium 检查桌面 1440×1000 与手机 390×844 视口及本地交互；仍需实体手机、软键盘与完整无障碍验收。内置 Preview 中继缺失，未生成用户可访问的预览链接。
- 验收 Realtime WebRTC、VAD 打断、权限拒绝、断线重连和文字/语音上下文连续性。
- 引入合法写实金毛 GLB 与居家环境，逐个验收动作过渡和移动端性能。
- 完成 Supabase Auth 与数据同步、用户级持久化、共享限流和已批准记忆的相关性检索。

实际自动检查结果见 `TESTING.md`。

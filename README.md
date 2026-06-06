# 健康管理应用

面向大众用户的轻量健康管理应用，支持注册登录、饮食记录（拼音首字母分类搜索）、营养统计、AI 训练/饮食计划生成、分条目打卡、身体数据追踪。

基于 **Taro 4.2 + React 18 + TypeScript** 前端，**Express + Node.js** 后端，**MySQL 8.0** 数据库。

AI4SE 期末项目，使用 Superpowers 规约驱动开发方法论。

## 功能特性

- 用户注册/登录（bcryptjs 密码哈希，注册需填性别/年龄/身高/体重）
- 饮食记录：217 种预设食物，拼音分类搜索，自定义食物 CRUD，历史日期浏览
- 营养统计：每日热量/蛋白质/脂肪/碳水/纤维汇总
- **AI 训练计划**：DeepSeek API，7 题问卷（频率/时长/部位/经验/场所/器械/强度），输出结构化周计划
- **AI 饮食计划**：DeepSeek API，5 级活动量选择，Mifflin-St Jeor 公式，输出三餐+营养素+克重
- **分条目打卡**：每个训练动作独立勾选完成/取消，持久化刷新不丢失
- 热量目标：AI 饮食计划联动，进度条可视化
- 身体数据：体重/身高（必填）/腰围/胸围/臀围，自动同步到个人信息
- 个人信息：性别/年龄/体重/身高/目标在线编辑

## 快速开始

### Docker（推荐）

```bash
docker-compose up --build
# 浏览器打开 http://localhost:3000
```

### 本地运行（无需 MySQL）

```bash
npm install --legacy-peer-deps
npm run build:h5
npx tsx src/server.ts
# 浏览器打开 http://localhost:3000
```

MySQL 不可用时自动回退 **内存存储模式**，功能完整可用，数据不持久化。

### AI 功能配置（DeepSeek）

在项目根目录创建 `deepseek-key.txt`，写入 API key（已加入 `.gitignore`）：

```bash
echo "sk-你的key" > deepseek-key.txt
```

或设置环境变量 `DEEPSEEK_API_KEY`。未配置时 AI 计划自动回退规则模板。

### 云部署

**阿里云 ECS 已部署**：http://47.116.36.135:3000

部署命令（Ubuntu 22.04）：
```bash
apt update && apt install git docker-compose -y
systemctl start docker
git clone https://github.com/cczznn/tree_health.git
cd tree_health
docker-compose up -d
```

### 微信小程序

```bash
npm run build:weapp
# 用微信开发者工具打开 dist/ 目录
```

## 端口与环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3000` | 服务端口 |
| `DB_HOST` | `localhost` | MySQL 地址 |
| `DB_PORT` | `3306` | MySQL 端口 |
| `DB_USER` | `health` | 数据库用户 |
| `DB_PASSWORD` | `health123` | 数据库密码 |
| `DB_NAME` | `health_app` | 数据库名 |
| `DEEPSEEK_API_KEY` | — | DeepSeek API key（可选） |

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| POST | `/api/auth/register` | 用户注册（需 name/password/age/gender/weight/height/goalType） |
| POST | `/api/auth/login` | 用户登录 |
| GET | `/api/auth/profile` | 获取个人信息 |
| PUT | `/api/auth/profile` | 更新个人信息 |
| PUT | `/api/auth/goal` | 修改健身目标 |
| GET | `/api/foods?query=` | 搜索食物 |
| GET | `/api/foods/:id` | 食物详情 |
| POST | `/api/foods` | 创建自定义食物 |
| PUT | `/api/foods/:id` | 编辑自定义食物 |
| DELETE | `/api/foods/:id` | 删除自定义食物 |
| GET | `/api/meal-records?date=` | 获取饮食记录 |
| POST | `/api/meal-records` | 新增饮食记录 |
| PUT | `/api/meal-records/:id` | 编辑饮食记录 |
| DELETE | `/api/meal-records/:id` | 删除饮食记录 |
| GET | `/api/stats/daily?date=` | 每日营养统计 |
| GET | `/api/workout-plans/current` | 获取当前训练计划 |
| POST | `/api/workout-plans/generate-ai` | AI 生成计划（body: `{ type, activityLevel, ...questionnaire }`） |
| GET | `/api/workout-plans/diet-current` | 获取当前饮食计划 |
| GET | `/api/workout-checkins` | 获取打卡记录 |
| POST | `/api/workout-checkins` | 提交打卡（body: `{ planId, date, note, exerciseName }`） |
| GET | `/api/body-metrics` | 获取身体数据 |
| POST | `/api/body-metrics` | 新增身体数据 |
| POST | `/api/recommendations/generate` | 生成 AI 推荐 |
| GET | `/api/calorie-target` | 获取热量目标（基于个人信息+身体数据） |

需登录的端点需带 `x-user-id` 请求头。预置管理员账号：`admin` / `admin123`。

## 目录结构

```
├── src/
│   ├── server.ts                         # Express 服务入口
│   ├── app-context.ts                    # 应用上下文（MySQL/内存模式切换）
│   ├── app.config.ts                     # Taro 应用配置
│   ├── api/                              # API 路由
│   │   ├── auth.ts                       # 注册/登录/个人信息
│   │   ├── foods.ts                      # 食物 CRUD
│   │   ├── meal-records.ts              # 饮食记录 CRUD
│   │   ├── stats.ts                      # 每日统计
│   │   ├── workout-plans.ts             # 训练/饮食计划
│   │   ├── workout-checkins.ts          # 打卡记录
│   │   ├── body-metrics.ts              # 身体数据
│   │   └── recommendations.ts           # AI 推荐
│   ├── auth/                             # 认证模块
│   │   ├── auth-service.ts
│   │   ├── user-repository.ts           # 内存用户仓库
│   │   └── mysql-user-repository.ts     # MySQL 用户仓库
│   ├── db/                               # 数据库层
│   │   ├── connection.ts                # MySQL 连接池
│   │   ├── schema.ts                    # 9 表结构
│   │   └── seed.ts                      # 种子数据（admin + 217 食物）
│   ├── domain/                           # 领域模型
│   │   ├── types.ts                     # 全部实体类型定义
│   │   ├── errors.ts                    # 统一错误类型
│   │   └── validation.ts               # 校验规则
│   ├── foods/                            # 食物服务
│   ├── meal-records/                     # 饮食记录服务
│   ├── stats/                            # 统计服务
│   ├── workout-plans/                    # 训练/饮食计划服务
│   ├── workout-checkins/                 # 打卡服务
│   ├── body-metrics/                     # 身体数据服务
│   ├── recommendations/                  # AI 推荐服务
│   ├── repositories/                     # 仓储层
│   │   ├── index.ts                     # 内存仓储
│   │   └── mysql-repos.ts              # MySQL 仓储（6 实体）
│   ├── lib/                              # 共享库
│   │   ├── api.ts                        # 前端 API 调用层
│   │   ├── ai-client.ts                 # DeepSeek 客户端
│   │   ├── ai-config.ts                 # API key 读取
│   │   ├── calorie-calc.ts             # Mifflin-St Jeor 公式
│   │   ├── auth-store.ts               # 前端认证状态
│   │   ├── page-data.ts                # 页面数据转换
│   │   ├── food-search.ts              # 食物搜索/营养素计算
│   │   ├── meal-form.ts                # 饮食表单校验
│   │   └── body-data.ts                # 身体数据校验/趋势
│   ├── pages/                            # 前端页面
│   │   ├── home.tsx                      # 首页（热量目标/今日概览/训练/饮食）
│   │   ├── diet.tsx                      # 饮食页（搜索/分类/记录/自定义食物）
│   │   ├── plan.tsx                      # 计划页（AI 生成/问卷/打卡/饮食建议）
│   │   ├── body.tsx                      # 身体页（体重围度/趋势/历史）
│   │   ├── me.tsx                        # 我的页（登录/注册/个人信息）
│   │   └── edit-profile.tsx            # 编辑个人信息
│   └── styles.css                        # 全局样式
├── tests/                                # 测试（113 个，18 文件）
├── config/                               # Taro 编译配置
├── docker-compose.yml                    # Docker 编排（app + MySQL）
├── Dockerfile                            # 多阶段构建
├── .github/workflows/ci.yml              # CI（typecheck + test + docker build）
├── SPEC.md                               # 需求规约
├── PLAN.md                               # 实现计划
├── AGENT_LOG.md                          # 智能体使用记录
└── REFLECTION.md                         # 反思报告
```

## 测试

```bash
npm test            # 运行所有测试（113 个）
npm run typecheck   # TypeScript 类型检查
npm run build:h5    # 构建 H5 前端
npm run build:weapp # 构建微信小程序
```

## 技术栈

- **前端**: Taro 4.2 / React 18 / TypeScript / pinyin-pro
- **后端**: Express / Node.js / bcryptjs
- **AI**: DeepSeek API（deepseek-chat），OpenAI SDK 兼容
- **数据库**: MySQL 8.0（可回退内存存储）
- **测试**: Vitest 3 / Supertest
- **CI/CD**: GitHub Actions
- **容器**: Docker + docker-compose

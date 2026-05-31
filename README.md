# T11 健康管理小程序

面向大众用户的轻量健康管理应用，支持饮食记录、营养统计、健身计划、运动打卡、身体数据追踪和 AI 推荐。

基于 **Taro 4.2 + React 18 + TypeScript** 前端，**Express + Node.js** 后端，**MySQL 8.0** 数据库。

AI4SE 期末项目，使用 Superpowers 规约驱动开发方法论。

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

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/foods?query=` | 搜索食物 |
| GET | `/api/foods/:id` | 食物详情 |
| POST | `/api/foods` | 创建自定义食物 |
| GET | `/api/meal-records?date=` | 获取饮食记录 |
| POST | `/api/meal-records` | 新增饮食记录 |
| PUT | `/api/meal-records/:id` | 编辑饮食记录 |
| DELETE | `/api/meal-records/:id` | 删除饮食记录 |
| GET | `/api/stats/daily?date=` | 每日营养统计 |
| GET | `/api/workout-plans/current` | 获取健身计划 |
| GET | `/api/workout-checkins` | 获取打卡记录 |
| POST | `/api/workout-checkins` | 提交打卡 |
| GET | `/api/body-metrics` | 获取身体数据 |
| POST | `/api/body-metrics` | 新增身体数据 |
| POST | `/api/recommendations/generate` | 生成 AI 推荐 |

所有请求需带 `x-user-id` 请求头（demo 用户为 `demo-user`）。

## 目录结构

```
├── src/
│   ├── server.ts                    # Express 服务入口
│   ├── api/                         # API 路由
│   │   ├── foods.ts
│   │   ├── meal-records.ts
│   │   ├── stats.ts
│   │   ├── workout-plans.ts
│   │   ├── workout-checkins.ts
│   │   ├── body-metrics.ts
│   │   └── recommendations.ts
│   ├── db/                          # MySQL 数据库层
│   │   ├── connection.ts
│   │   ├── schema.ts
│   │   └── seed.ts
│   ├── domain/                      # 领域模型
│   │   ├── types.ts
│   │   ├── errors.ts
│   │   └── validation.ts
│   ├── foods/                       # 食物服务
│   ├── meal-records/                # 饮食记录服务
│   ├── stats/                       # 统计服务
│   ├── workout-plans/               # 健身计划服务
│   ├── workout-checkins/            # 打卡服务
│   ├── body-metrics/                # 身体数据服务
│   ├── recommendations/             # AI 推荐服务
│   ├── repositories/                # 数据仓储层
│   ├── lib/                         # 前端工具函数
│   │   ├── api.ts                   # API 调用层
│   │   ├── page-data.ts             # 页面数据转换
│   │   ├── food-search.ts           # 食物搜索/营养素计算
│   │   ├── meal-form.ts             # 饮食表单校验
│   │   └── body-data.ts             # 身体数据校验/趋势
│   ├── pages/                       # 前端页面
│   │   ├── home.tsx                   # 首页
│   │   ├── diet.tsx                   # 饮食页
│   │   ├── plan.tsx                   # 计划页
│   │   ├── body.tsx                   # 身体页
│   │   └── me.tsx                     # 我的页
│   └── styles.css
├── tests/                           # 测试
│   ├── lib/                         # 前端工具测试
│   └── api/                         # API 集成测试
├── config/                          # Taro 编译配置
├── docker-compose.yml               # Docker 编排
├── Dockerfile                       # Docker 镜像构建
└── .github/workflows/ci.yml         # CI 配置
```

## 测试

```bash
npm test            # 运行所有测试
npm run typecheck   # TypeScript 类型检查
npm run build:h5    # 构建 H5 前端
npm run build:weapp # 构建微信小程序
```

## 技术栈

- **前端**: Taro 4.2 / React 18 / TypeScript
- **后端**: Express 5 / Node.js
- **数据库**: MySQL 8.0（可回退内存存储）
- **测试**: Vitest / Supertest
- **CI/CD**: GitHub Actions
- **容器**: Docker + docker-compose

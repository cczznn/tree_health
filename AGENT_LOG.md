# AGENT_LOG.md

> 按时间顺序记录与 Superpowers / Cursor 协作完成本项目规约、计划与实现阶段的关键节点。

---

## 2026-05-23

### 1. 启动项目与读取课程要求
- **时间戳**：2026-05-23
- **任务编号**：无（项目启动）
- **阶段**：需求理解 / 项目启动
- **触发技能**：无（先完成文档理解）
- **关键上下文**：课程期末项目要求使用 Superpowers 完成规约驱动智能体开发，需要产出 `SPEC.md`、`PLAN.md`、`SPEC_PROCESS.md` 等文档。
- **动作**：读取课程说明文档，梳理项目要求，确认交付物与流程。
- **结果**：明确本项目不是单纯开发软件，而是要展示从需求到实现的完整 AI4SE 工程闭环。
- **学到的教训**：在开始写代码前，必须先把流程、文档和交付标准理解清楚，否则后面很容易返工。

### 2. 克隆 Superpowers 仓库并查看安装说明
- **时间戳**：2026-05-23
- **任务编号**：无（工具链准备）
- **阶段**：工具链准备
- **触发技能**：无（仓库安装准备）
- **关键上下文**：用户选择使用 Cursor，并希望把 Superpowers 作为 Cursor skills 使用。
- **动作**：克隆 `superpowers` 仓库，阅读安装文档与 Cursor 相关配置。
- **结果**：确认 Cursor 的安装方式是通过 `/add-plugin superpowers` 或插件市场安装。
- **学到的教训**：不同 agent/harness 的安装方式不同，不能把 OpenCode 的说明直接套到 Cursor 上。

### 3. 启动 brainstorming，收敛项目方向
- **时间戳**：2026-05-23
- **任务编号**：无（规约阶段）
- **阶段**：brainstorming
- **触发技能**：`brainstorming`
- **关键上下文**：项目起点为“健康、健身、饮食类小程序”，但范围模糊。
- **动作**：通过一系列问题澄清目标用户、使用场景、核心痛点、功能边界和最小可行版本。
- **结果**：项目收敛为一个面向大众通用用户的健康管理工具，核心问题聚焦为饮食摄入、饮食搭配与健身计划安排。
- **学到的教训**：如果不先明确用户与痛点，健康类项目会很容易泛化成没有主线的功能拼盘。

### 4. 决定引入 AI 推荐，并明确推荐边界
- **时间戳**：2026-05-23
- **任务编号**：无（规约阶段）
- **阶段**：brainstorming / 需求修订
- **触发技能**：`brainstorming`
- **关键上下文**：原先对 AI 推荐是否纳入核心范围并不确定。
- **动作**：在澄清需求过程中，决定保留 AI 推荐，但限制为“结构化规则 + LLM 文本生成”的混合方案，不做开放式聊天机器人。
- **结果**：AI 推荐被写入 `SPEC.md`，并明确了规则优先、LLM 负责组织文本、数据不足时降级为通用建议。
- **学到的教训**：推荐模块必须可控、可测，不能把“AI 功能”做成自由聊天问答。

### 5. 明确产品形态为微信小程序并加入底部 tab 栏
- **时间戳**：2026-05-23
- **任务编号**：无（规约阶段）
- **阶段**：brainstorming / 需求修订
- **触发技能**：`brainstorming`
- **关键上下文**：项目要最终上线到微信小程序，而不是仅仅做一个 Web 原型。
- **动作**：确认必须具备小程序布局感，并要求底部 tab 栏。
- **结果**：`SPEC.md` 中明确写入“最终上线到微信小程序”的目标，以及底部 tab 栏与小程序常见布局习惯。
- **学到的教训**：如果不把“最终交付形态”写死，前端任务很容易偏成普通 Web 界面。

### 6. 明确数据边界：登录、用户隔离、自定义食物私有化
- **时间戳**：2026-05-23
- **任务编号**：无（规约阶段）
- **阶段**：brainstorming / 需求修订
- **触发技能**：`brainstorming`
- **关键上下文**：健康、体重、饮食数据都属于个人私密数据。
- **动作**：决定需要登录与用户隔离，自定义食物仅属于对应用户，不与其他用户共享。
- **结果**：所有核心数据模型都增加 `userId` 维度，并把用户隔离写入 `SPEC.md`。
- **学到的教训**：健康类产品不能默认“单用户玩具化”，必须尽早考虑数据隔离。

### 7. 统一食物库搜索与来源策略
- **时间戳**：2026-05-23
- **任务编号**：无（规约阶段）
- **阶段**：brainstorming / 需求修订
- **触发技能**：`brainstorming`
- **关键上下文**：食物库中既有预置食物，也有用户自定义食物。
- **动作**：决定预置食物和自定义食物共享同一搜索接口，搜索结果默认不强制区分来源，但数据层保留来源字段。
- **结果**：`SPEC.md` 增加 `sourceType` 设计，并允许重名食物存在多个来源。
- **学到的教训**：前端体验要简洁，但后端数据层必须保留审计和区分能力。

### 8. 统一趋势视图为简单列表 + 最近变化值
- **时间戳**：2026-05-23
- **任务编号**：无（规约阶段）
- **阶段**：brainstorming / 需求修订
- **触发技能**：`brainstorming`
- **关键上下文**：体重 / 围度变化展示方式需要控制复杂度。
- **动作**：将趋势视图从复杂图表收敛为简单列表 + 最近变化值。
- **结果**：相关需求写入 `SPEC.md`，同时降低前端实现与测试难度。
- **学到的教训**：对于课程项目，能清楚表达变化趋势往往比复杂图表更重要。

### 9. 决定单仓库前后端分层与单容器优先策略
- **时间戳**：2026-05-23
- **任务编号**：无（规约阶段）
- **阶段**：brainstorming / 技术边界修订
- **触发技能**：`brainstorming`
- **关键上下文**：项目需要兼顾课程交付节奏与后续部署。
- **动作**：确定采用单仓库前后端分层架构，并以单容器为主，只有确实拆分服务时才使用 docker-compose。
- **结果**：`SPEC.md` 的架构和容器化策略被显式写死。
- **学到的教训**：部署复杂度必须在一开始控制，否则后续会拖慢整个实现节奏。

### 10. 生成并整理 `PLAN.md`
- **时间戳**：2026-05-23
- **任务编号**：无（规约阶段）
- **阶段**：writing-plans
- **触发技能**：`writing-plans`
- **关键上下文**：`SPEC.md` 已确定主要功能、边界和产品形态。
- **动作**：将需求拆成 13 个可由单个 subagent 在一次会话中完成的任务，明确每个任务的目标、涉及文件、实现要点、验证步骤和依赖关系。
- **结果**：生成了覆盖基础工程、数据模型、食物库、饮食记录、统计、AI 推荐、前端、联调、容器化与 CI 的完整计划。
- **学到的教训**：任务拆分越清晰，后续 subagent 越不容易跑偏；每个任务必须先写失败测试。

### 11. 生成 `SPEC_PROCESS.md` 初稿
- **时间戳**：2026-05-23
- **任务编号**：无（文档沉淀）
- **阶段**：文档沉淀
- **触发技能**：无（由总结性写作完成）
- **关键上下文**：课程要求记录 brainstorming 与 plan 生成过程。
- **动作**：编写 `SPEC_PROCESS.md` 初稿，概述项目从模糊主题逐步收敛为明确方案的过程。
- **结果**：形成了一个结构化的过程文档初稿。
- **学到的教训**：过程文档不能只写结论，必须体现推理、迭代和决策依据。

### 12. 补强 `SPEC_PROCESS.md` 的对话节选与决策对照
- **时间戳**：2026-05-23
- **任务编号**：无（文档修订）
- **阶段**：文档修订
- **触发技能**：无（文档重写）
- **关键上下文**：作业要求明确写到“至少 3 轮关键迭代的对话节选”和“哪些建议是 AI 提出而你采纳/推翻的”。
- **动作**：补写 3 轮以上的关键迭代小节，加入对话节选风格的摘要，并增加 AI 建议 vs 人工决策的对照。
- **结果**：`SPEC_PROCESS.md` 更贴近课程 rubric，过程证据更完整。
- **学到的教训**：过程文档必须有“证据感”，否则很难体现你真实参与了需求收敛。

### 13. 调整前端技术选型为 Taro + TypeScript + React
- **时间戳**：2026-05-23
- **任务编号**：无（SPEC 修订）
- **阶段**：SPEC 修订
- **触发技能**：无（需求澄清）
- **关键上下文**：用户要求最终上线到微信小程序，并希望采用可编译到小程序的技术栈。
- **动作**：把 `SPEC.md` 里的前端选型从泛 Web/小程序风格表述，改为 `Taro + TypeScript + React`，并将相关描述调整为“基于 Taro 的小程序端界面，最终编译对齐微信小程序”。
- **结果**：技术选型与目标交付形态一致，不再是“像小程序的 Web”而是“可编译成小程序的前端”。
- **学到的教训**：技术选型必须与最终上线目标一致，否则文档会自相矛盾。

### 14. 调整数据库选型为 MySQL 或 SQLite
- **时间戳**：2026-05-23
- **任务编号**：无（SPEC 修订）
- **阶段**：SPEC 修订
- **触发技能**：无（需求澄清）
- **关键上下文**：用户当前没有安装 PostgreSQL，希望避免额外安装成本。
- **动作**：将 `SPEC.md` 中数据库选型改为 MySQL 或 SQLite，理由写明 SQLite 适合本地快速开发，MySQL 适合后续线上部署。
- **结果**：数据库选型更加贴近当前开发条件，也保留了后续迁移空间。
- **学到的教训**：选型不能只写“理想方案”，还要考虑当前环境与实现门槛。

---

## 2026-05-24

### 15. 继续审视 `SPEC.md` 与 `PLAN.md` 的一致性
- **时间戳**：2026-05-24
- **任务编号**：无（文档校对）
- **阶段**：文档校对
- **触发技能**：无
- **关键上下文**：用户开始检查 SPEC 的技术选型是否真的能支撑最终目标。
- **动作**：核对 `SPEC.md` 中前端、数据库、架构与 `PLAN.md` 任务拆分是否一致。
- **结果**：确认总体一致，主要修改集中在前端技术栈与数据库选型上。
- **学到的教训**：SPEC、PLAN、过程文档三者必须互相对齐，否则后续实现阶段会不断返工。

### 16. 形成当前的最终规约版本
- **时间戳**：2026-05-24
- **任务编号**：无（规约定稿）
- **阶段**：规约定稿
- **触发技能**：无
- **关键上下文**：需要将所有关键决策写成可执行、可验收的最终版文档。
- **动作**：整理并确认当前版 `SPEC.md`、`PLAN.md` 与 `SPEC_PROCESS.md` 的一致性。
- **结果**：规约层文档已基本可作为后续实现的稳定基线。
- **学到的教训**：在进入实现前，规约层越稳定，后续的 TDD 和 subagent 开发越顺利。

### 17. T1 冷启动实现：脚手架与测试框架
- **时间戳**：2026-05-24
- **任务编号**：T1
- **阶段**：实现 / TDD / worktree 隔离
- **触发技能**：`test-driven-development`、`subagent-driven-development`
- **关键上下文**：按照实验要求，先在独立 worktree 中实现 T1，并确保先有失败测试，再最小实现，再验证。
- **动作**：
  - 使用 `git worktree add ../last-t1 -b feature/t1-scaffold` 创建独立工作区
  - 先补充 `vitest.config.ts` 与 `tests/scaffold.test.ts`
  - 首次运行测试时发现缺少依赖 / 默认 npm cache 目录权限问题
  - 通过设置项目内 cache 后执行 `npm install`
  - 再次运行 `npm test`，确认测试通过
- **结果**：T1 脚手架可运行，Vitest 已经能正常执行，基础测试命令通过。
- **学到的教训**：
  - Windows 环境下默认 npm cache 路径可能触发权限问题，最好尽早把 cache 放到项目内
  - T1 的核心不是“写很多代码”，而是先把测试框架和最小验证链路打通
  - worktree 隔离很适合后续并行任务，但前提是每个 worktree 都有清晰的任务边界

### 18. T2 冷启动实现：数据模型、错误类型与仓储层
- **时间戳**：2026-05-24
- **任务编号**：T2
- **阶段**：实现 / TDD / worktree 隔离
- **触发技能**：`test-driven-development`、`subagent-driven-development`、`systematic-debugging`
- **关键上下文**：T2 需要继承 T1 的脚手架，在最新 `master` 基线下重新创建干净 worktree，并先写失败测试再补最小实现。
- **动作**：
  - 删除旧的 `feature/t2-domain-repo` 关联，基于最新 `master` 重新创建 `last-t2` worktree
  - 先写 `tests/domain/validation.test.ts` 与 `tests/repositories/food-repository.test.ts`
  - 补齐 `src/domain/errors.ts`、`src/domain/types.ts`、`src/domain/validation.ts`、`src/foods/preset-foods.ts`、`src/repositories/index.ts`
  - 多轮运行 `npm test`，修复预置食物数量不达标、重复导出、数量超出目标等红灯
  - 最终将预置食物数据精确调整为 100 条，验证 T2 相关测试全绿
- **结果**：T2 的领域模型、错误类型、校验规则、内存仓储与预置食物数据已落地，相关测试全绿，满足后续 T3/T4/T7/T9 的基础依赖。
- **学到的教训**：
  - 冷启动验证暴露出“预置数据规模”必须写死，否则陌生智能体会卡住
  - 先写测试能快速暴露实现边界问题，尤其是数据条数和导出重复这类细节
  - worktree 从最新 master 重建能显著降低历史脏状态带来的干扰

### 19. T3 冷启动实现：食物库与搜索 API
- **时间戳**：2026-05-24
- **任务编号**：T3
- **阶段**：实现 / TDD / worktree 隔离
- **触发技能**：`test-driven-development`、`subagent-driven-development`、`systematic-debugging`
- **关键上下文**：T3 需要在最新 `master` 上重新创建干净 worktree，并先写食物搜索、详情、自定义创建与 API 的失败测试，再补最小实现。
- **动作**：
  - 删除旧的 `feature/t3-food-search` 关联，基于最新 `master` 重新创建 `last-t3` worktree
  - 先写 `tests/foods/food-service.test.ts`、`tests/repositories/food-repository.test.ts`、`tests/api/foods-api.test.ts`
  - 补齐 `src/foods/food-service.ts`、`src/api/foods.ts`、`src/repositories/index.ts` 与预置食物初始化逻辑
  - 多轮运行 `npm test`，修复 `validInput` 作用域问题与实现缺失带来的红灯
  - 验证搜索、详情、自定义创建、配额限制、预置食物数量与可见性规则均通过
- **结果**：T3 的食物搜索 API、服务层、自定义创建与 API 集成测试全部通过，满足后续 T4/T5/T6 的依赖前提。
- **学到的教训**：
  - 测试作用域问题会伪装成实现问题，先读报错再改代码很重要
  - 预置数据和仓储初始化必须一致，否则 API/服务/仓储三层测试会同时报警
  - worktree 基线对齐后，TDD 定位会更清晰，避免旧分支状态干扰

### 20. T4 冷启动实现：饮食记录 CRUD 与日汇总
- **时间戳**：2026-05-24
- **任务编号**：T4
- **阶段**：实现 / TDD / worktree 隔离
- **触发技能**：`test-driven-development`、`subagent-driven-development`、`systematic-debugging`
- **关键上下文**：T4 要实现饮食记录新增、编辑、删除、按日查询，以及独立持久化日汇总；用户明确要求新增增量、编辑/删除整天重算。
- **动作**：
  - 基于当前 `master` 创建 `last-t4` 独立 worktree 和 `feature/t4-meal-records` 分支
  - 先写 `tests/meal-records/meal-record-service.test.ts` 和 `tests/api/meal-records-api.test.ts`
  - 补齐 `DailyMealSummary`、`MealRecordRepository`、`DailyMealSummaryRepository`、`MealRecordService` 与 `src/api/meal-records.ts`
  - 在红灯阶段逐步修复：缺失模块、用户隔离、日期必填、自定义食物归属、日期变更重算等边界
  - 最终 `npm test` 通过，T4 的主路径与边界场景都变绿
- **结果**：T4 完成，日汇总独立持久化且支持混合更新策略；相关测试全绿。
- **学到的教训**：
  - 记录变更与汇总更新最好在服务层统一编排，不要散落在 API 层
  - 编辑改日期是一个容易漏掉的边界，必须显式测试
  - 用户隔离与详情可见性最好从一开始就写入 API / service，而不是后补

### 21. T4 之后的代码自检与边界补强
- **时间戳**：2026-05-24
- **任务编号**：T4（收尾）
- **阶段**：代码自检 / 边界修正
- **触发技能**：`systematic-debugging`、`test-driven-development`
- **关键上下文**：用户要求对 T4 进行额外代码自检与边界梳理。
- **动作**：
  - 检查 `MealRecordService`、`FoodRepository`、`FoodService`、`api` 层与相关测试
  - 发现并补强用户隔离、日期必填、自定义食物归属检查、日期变更重算等边界
  - 追加测试覆盖：查看/修改/删除他人记录、缺少日期参数、改日期后旧新汇总同步
- **结果**：T4 边界场景补齐，测试集合扩大且依然保持全绿。
- **学到的教训**：功能主流程绿灯并不代表边界稳固；额外自检能有效把“看起来能用”变成“真的合规”。

### 22. 清理剩余 TypeScript typecheck 报错
- **时间戳**：2026-05-24
- **任务编号**：T4（工程质量收尾）
- **阶段**：类型修复 / 验证
- **触发技能**：`systematic-debugging`
- **关键上下文**：运行 `npm run typecheck` 后暴露出 Node、Express、Supertest、query 参数和 `validateMealRecord` 的类型报错。
- **动作**：
  - 安装并启用 `@types/node`、`@types/express`、`@types/supertest`
  - 调整 `tsconfig.json` 的 `types` 为 `vitest/globals` + `node`
  - 修正 `validateMealRecord` 的类型定义，使其支持测试与服务层的调用方式
  - 修正 API 层 query / params 的类型处理
  - 修正 `MealRecordService` 中日期类型推断问题
- **结果**：`npm run typecheck` 最终通过，项目类型错误清零。
- **学到的教训**：测试能过不代表类型系统健康；在 TypeScript 项目里，`typecheck` 是独立且必须过的一道关。

### 23. 按课程要求回写 `PLAN.md` 与 `AGENT_LOG.md`
- **时间戳**：2026-05-24
- **任务编号**：T4（文档同步）
- **阶段**：文档同步
- **触发技能**：无（按课程要求整理实现记录）
- **关键上下文**：课程要求 `PLAN.md` 持续更新，并维护完整的 `AGENT_LOG.md` 过程记录。
- **动作**：
  - 将 `PLAN.md` 的 `T3`/`T4` 结果记录更新为实际完成状态与 commit hash
  - 把 T4 的独立持久化日汇总策略写入计划文档
  - 在 `AGENT_LOG.md` 中追加 T4 实现、边界修正与 typecheck 收敛的记录
- **结果**：计划文档与实现状态保持一致，过程日志更完整。
- **学到的教训**：文档不是“做完之后随便补”，而是实现过程的一部分；持续同步能减少最终整理成本。

### 24. 文档版本提交到 `master`
- **时间戳**：2026-05-24
- **任务编号**：无（文档同步）
- **阶段**：文档提交
- **触发技能**：无
- **关键上下文**：用户要求把 `last` 目录下文档修改提交到 `master`，以便后续在对应 worktree 内减少额外提交次数。
- **动作**：将 `PLAN.md`、`AGENT_LOG.md` 和 `SPEC_PROCESS.md` 的更新统一提交到本地 `master`。
- **结果**：本地 `master` 获得文档同步提交，后续可基于更干净的基线创建新 worktree。
- **学到的教训**：把文档同步到主干，可以让后续任务 worktree 的上下文更稳定，也更容易减少重复提交。

### 25. 同步本地 `master` 与远端最新状态
- **时间戳**：2026-05-24
- **任务编号**：无（仓库同步）
- **阶段**：仓库同步
- **触发技能**：无
- **关键上下文**：需要确保后续新建任务 worktree 时，基线与远端一致。
- **动作**：执行远端同步操作，使本地 `master` 与远端最新提交保持一致。
- **结果**：本地 `master` 已同步到远端最新状态，可直接作为后续 `T5` 的基线。
- **学到的教训**：在新任务前先同步基线，可以减少“本地和远端不一致”导致的分叉问题。

### 26. T5 冷启动实现：单日热量 / 营养素统计与目标对比
- **时间戳**：2026-05-25
- **任务编号**：T5
- **阶段**：实现 / TDD / worktree 隔离
- **触发技能**：`test-driven-development`、`subagent-driven-development`、`systematic-debugging`
- **关键上下文**：T5 只做“某一天”的统计口径，要求在独立 `last-t5` worktree 中先写失败测试，再实现单日统计、空状态和简单目标对比。
- **动作**：
  - 创建 `last-t5` worktree 并以 `feature/t5-daily-stats` 分支推进
  - 先写 `tests/stats/daily-stats-service.test.ts` 与 `tests/api/stats-api.test.ts`
  - 补齐 `src/stats/daily-stats-service.ts`、`src/api/stats.ts`
  - 复用 `meal-records` 的共享上下文，确保统计和记录使用同一数据源
  - 通过多轮修正让 `npm test` 与 `npm run typecheck` 都通过
- **结果**：T5 单日统计能力落地，测试与类型检查均通过。
- **学到的教训**：统计类能力最好从“单日闭环”开始，否则很容易在范围上失控；共享上下文必须重置，否则测试之间会相互污染。

### 27. T5 完成后的问题修复与上下文隔离
- **时间戳**：2026-05-25
- **任务编号**：T5（收尾）
- **阶段**：代码修正 / 边界补强
- **触发技能**：`systematic-debugging`
- **关键上下文**：T5 在集成测试中暴露了共享上下文污染与目标对比字段缺失问题。
- **动作**：
  - 将 `app-context` 改为可重置的 `beginNewAppContext()` 机制
  - 为 `meal-records` 与 `stats` API 统一切换到同一上下文
  - 为统计结果补充 `goalComparison`，并修复日期 / 用户头的边界处理
- **结果**：统计与记录在测试中稳定共享同一数据源，T5 相关测试最终全部通过。
- **学到的教训**：状态型内存仓储在测试环境中一定要可重置，否则集成测试会出现难以定位的串扰问题。

### 28. T6 冷启动设计与确认：自定义食物创建规则收敛
- **时间戳**：2026-05-25
- **任务编号**：T6（设计阶段）
- **阶段**：brainstorming / 需求澄清
- **触发技能**：`brainstorming`
- **关键上下文**：用户要求实现 T6，并明确希望在 `E:\6\ai\last-t6` worktree 中完成，同时要遵循课程文档第 131–139 行对 T6 的要求。
- **动作**：
  - 先确认“自定义食物创建后必须立刻出现在搜索里，且允许同名”
  - 进一步确认字段策略后，用户决定：`name + calories + protein + fat + carbs` 必填，`fiber / sugar / sodium` 可选
  - 讨论后确定可选营养字段应以 `null` 语义保存，而不是默认补 0
  - 将设计收敛为：创建后立即可搜、允许同名、用户隔离不变、可选字段兼容空值
- **结果**：T6 的输入规则和数据语义已明确，不再沿用 SPEC 中“全字段必填”的更严格版本。
- **学到的教训**：当课程 SPEC 与实际产品决策不完全一致时，必须把最终采用的规则显式写下来，不能默认实现者自行猜测。

### 29. T6 实现：自定义食物创建与搜索联动
- **时间戳**：2026-05-25
- **任务编号**：T6
- **阶段**：实现 / TDD / worktree 隔离
- **触发技能**：`test-driven-development`、`subagent-driven-development`、`systematic-debugging`
- **关键上下文**：T6 需要在 `E:\6\ai\last-t6` 中完成，且要保留与 T3/T4/T5 一致的用户隔离、搜索联动和 API 行为。
- **动作**：
  - 检查 `last-t6` worktree 与已有代码状态
  - 读取 `src/domain/types.ts`、`src/domain/validation.ts`、`src/foods/food-service.ts`、`src/repositories/index.ts`、`src/api/foods.ts`、`tests/api/foods-api.test.ts`
  - 将 `CreateCustomFoodInputDTO` 的可选字段调整为 `fiber/sugar/sodium?: number | null`
  - 把 `validateFood` 扩展为允许可选字段为 `null`
  - 在 `FoodService.createCustomFood()` 中将缺失的可选字段落库为 `null`
  - 将 API 测试里的创建请求 body 调整为只传必填字段，确保兼容简化输入规则
  - 运行 `npm install` 补齐 `last-t6` worktree 的依赖后，再执行 `npm run typecheck` 与 `npm test`
- **结果**：T6 的自定义食物创建能力已实现，创建后能立即进入搜索结果，且允许同名；类型检查和测试均通过。
- **学到的教训**：
  - 课程文档中的规范不一定是最终产品规则，必须以用户确认的方案为准
  - 可选字段最好在类型层、校验层、服务层一起调整，否则很容易出现“类型过了但运行时不兼容”
  - 在独立 worktree 中实现任务时，先补依赖再验收能减少环境问题对判断的干扰

### 30. T7 需求确认：最小输入与实现边界收敛
- **时间戳**：2026-05-25
- **任务编号**：T7（设计阶段）
- **阶段**：brainstorming / 需求澄清
- **触发技能**：`brainstorming`
- **关键上下文**：用户要求在 `last-t7` worktree 中推进 T7，并先确认训练计划的最小输入。
- **动作**：
  - 确认 T7 输入采用“目标类型 + 每周训练频率”
  - 讨论并选择了规则模板生成方案，避免引入自由生成带来的不稳定性
  - 收敛出按目标分类、按频率展开训练日程的实现边界
- **结果**：T7 的输入与输出边界已经明确，可开始 TDD 实现。
- **学到的教训**：训练计划这种模块如果输入过多，容易让任务范围失控；先用最小输入把规则跑通最稳妥。

### 31. T7 实现：健身计划模板与生成
- **时间戳**：2026-05-25
- **任务编号**：T7
- **阶段**：实现 / TDD / worktree 隔离
- **触发技能**：`test-driven-development`、`subagent-driven-development`、`systematic-debugging`
- **关键上下文**：T7 要在独立 `last-t7` worktree 中实现，先写失败测试，再补模板服务，最后验证类型与测试。
- **动作**：
  - 创建 `feature/t7-workout-plans` worktree
  - 先写 `tests/workout-plans/workout-plan-service.test.ts`
  - 新增 `src/workout-plans/workout-plan-service.ts`
  - 通过规则模板根据 `goalType + frequencyPerWeek` 生成不同训练安排
  - 修复类型与断言问题后，使 `npm run typecheck` 与 `npm test` 均通过
- **结果**：T7 的健身计划模板与生成能力已完成，输出结构化训练计划，可供后续打卡模块引用。
- **学到的教训**：模板驱动比自由生成更稳定，也更适合课程项目的可验证要求；测试里应该明确断言输出结构，而不仅是标题文本。

### 32. T8 需求确认：打卡策略与绑定粒度收敛
- **时间戳**：2026-05-25
- **任务编号**：T8（设计阶段）
- **阶段**：brainstorming / 需求澄清
- **触发技能**：`brainstorming`
- **关键上下文**：用户要求在 `last-t8` worktree 中推进 T8，并先确认重复打卡策略与绑定粒度。
- **动作**：
  - 确认同一天允许多次提交，按时间顺序保留多条记录
  - 确认打卡绑定粒度为 `planId + date + note`
  - 收敛出轻量记录型打卡模型，不做动作级唯一性限制
- **结果**：T8 的输入与查询规则已经明确，可开始 TDD 实现。
- **学到的教训**：打卡功能如果过早引入唯一性约束，会直接和“保留历史”目标冲突；先保留多条记录最稳妥。

### 33. T8 实现：运动打卡与按日查询
- **时间戳**：2026-05-25
- **任务编号**：T8
- **阶段**：实现 / TDD / worktree 隔离
- **触发技能**：`test-driven-development`、`subagent-driven-development`、`systematic-debugging`
- **关键上下文**：T8 需要在独立 `last-t8` worktree 中实现，先写失败测试，再补打卡服务与仓储支持，最后验证类型与测试。
- **动作**：
  - 创建 `feature/t8-checkins` worktree
  - 新增 `src/workout-checkins/workout-checkin-service.ts`
  - 增补 `WorkoutPlanRepository` 与 `WorkoutCheckinRepository`
  - 先写 `tests/workout-checkins/workout-checkin-service.test.ts`
  - 按 `planId + date` 查询当天全部打卡记录，同一天重复提交保留历史
  - 运行 `npm run typecheck` 与 `npm test`
- **结果**：T8 的运动打卡与查询能力已完成，测试与类型检查均通过。
- **学到的教训**：只要把“创建”和“查询”两条主路径打通，打卡功能就能形成稳定闭环；重复提交不要在仓储层偷偷覆盖。

### 34. T9 冷启动设计与确认：记录型 CRUD + 简单趋势函数
- **时间戳**：2026-05-25
- **任务编号**：T9（设计阶段）
- **阶段**：brainstorming / 需求澄清
- **触发技能**：`brainstorming`
- **关键上下文**：用户要求在 `last-t9` worktree 中推进 T9，并确认最小输入与趋势输出方式。
- **动作**：
  - 确认 T9 最小输入采用 `metricDate + weight`，围度可选
  - 选择“记录型 CRUD + 简单趋势函数”方案
  - 收敛出 `latest / previous / delta / direction` 的轻量趋势结构
- **结果**：T9 的输入与趋势边界已经明确，可开始 TDD 实现。
- **学到的教训**：体重与围度记录最重要的是稳定保存和清晰趋势，不必一开始就做复杂图表或体型分析。

### 35. T9 实现：体重 / 围度记录与趋势
- **时间戳**：2026-05-25
- **任务编号**：T9
- **阶段**：实现 / TDD / worktree 隔离
- **触发技能**：`test-driven-development`、`subagent-driven-development`、`systematic-debugging`
- **关键上下文**：T9 需要在独立 `last-t9` worktree 中实现，先写失败测试，再补身体数据仓储和趋势函数，最后验证类型与测试。
- **动作**：
  - 创建 `feature/t9-body-metrics` worktree
  - 新增 `src/body-metrics/body-metric-service.ts`
  - 增补 `BodyMetricRepository`
  - 先写 `tests/body-metrics/body-metric-service.test.ts`
  - 实现保存、按日期范围查询、趋势函数与边界校验
  - 运行 `npm run typecheck` 与 `npm test`
- **结果**：T9 的体重 / 围度记录与趋势输出能力已完成，测试与类型检查均通过。
- **学到的教训**：趋势函数本质上是可测试的纯逻辑，应该尽量与持久化分离，方便后续扩展和前端展示。

### 36. T10 冷启动设计：规则引擎 + 模板化文案
- **时间戳**：2026-05-25
- **任务编号**：T10（设计阶段）
- **阶段**：brainstorming / 需求澄清
- **触发技能**：`brainstorming`
- **关键上下文**：用户要求在 `last-t10` worktree 中推进 T10，并选择方案 B：规则引擎 + 模板化文案，输入最小依赖为饮食统计、健身计划、体重趋势和用户目标信息。
- **动作**：
  - 确认推荐不是自由聊天，而是结构化建议生成
  - 讨论并采用规则 + 模板输出，而不是可选 LLM 包装
  - 收敛出推荐输出的结构化字段与回退策略
  - 明确本任务只做单轮结构化推荐，不引入长期记忆或医疗建议
- **结果**：T10 的输入与输出边界已明确，可开始进入实现阶段。
- **学到的教训**：AI 推荐如果没有结构化输入和稳定模板，很容易从“推荐”变成“不可控文本生成”；课程项目里稳定性优先。

### 37. T10 实现：结构化推荐与降级策略
- **时间戳**：2026-05-25
- **任务编号**：T10
- **阶段**：实现 / TDD / worktree 隔离
- **触发技能**：`test-driven-development`、`subagent-driven-development`、`systematic-debugging`
- **关键上下文**：T10 需要在独立 `last-t10` worktree 中实现，并把“饮食统计、健身计划、体重趋势、用户目标信息”整合成一轮可解释推荐。
- **动作**：
  - 新增 `RecommendationService` 与对应测试骨架
  - 设计结构化推荐输出，采用原因 + 建议的形式
  - 为数据不足场景加入降级建议
  - 通过类型检查与测试验证实现稳定性
- **结果**：T10 的基础推荐生成能力已完成，输出结构化、可解释且可降级。
- **学到的教训**：把推荐拆成规则判断和模板文案后，测试会更清晰，输出也更适合前端消费。

### 38. T11 预处理：在前端 worktree 中修复后端审查问题
- **时间戳**：2026-05-26
- **任务编号**：T11（预处理）
- **阶段**：代码修复 / 收尾整理
- **触发技能**：`receiving-code-review`、`systematic-debugging`
- **关键上下文**：在进入 T11 前端页面开发前，先处理 `last-t11` worktree 中审查出的后端实现问题，避免后续页面联调用到带缺陷的基础能力。
- **动作**：
  - 修复 `MealRecordService` 中更新/重算逻辑里残留的 `as any`
  - 调整 `rebuildSummary` 的空状态语义，避免删除最后一条记录后返回含混的汇总对象
  - 将仓储层 `getById` 的错误实体名改为具体实体名，提升错误可读性
  - 统一处理 `x-user-id` 相关的缺失判断思路，并为 `WorkoutCheckin` 增加 `createdAt`
  - 运行 `npm test` 与 `npm run typecheck` 验证修复结果
- **结果**：T11 worktree 的基础后端能力已收敛，测试和类型检查通过，可继续进行前端骨架实现。
- **学到的教训**：前端开发前先把底层数据与错误语义修稳，能显著减少联调阶段的噪音和返工。

### 39. T11 环境修复：解决微信小程序空白页面问题
- **时间戳**：2026-05-27
- **任务编号**：T11（环境修复）
- **阶段**：调试 / 问题定位
- **触发技能**：`systematic-debugging`
- **关键上下文**：Taro 编译后在微信开发者工具中打开，所有页面内容空白，仅底部 tab 栏正常显示。
- **动作**：
  - 检查微信开发者工具控制台，发现 `ReferenceError: React is not defined`
  - 排查发现 JSX 编译为 `React.createElement` 全局调用，但 webpack ProvidePlugin 未生效
  - `babel.config.cjs` 中 `@babel/preset-react` 改为 `{ runtime: 'automatic' }`，JSX 编译产物从 `React.createElement` 变为 `react/jsx-runtime` 的 `jsx/jsxs`
  - `config/index.ts` 中显式添加 `plugins: ['@tarojs/plugin-framework-react']`
  - 删除多余的 `src/main.tsx`（Taro 不需要 `createRoot` + `document.getElementById`）
  - CSS 引入从 `main.tsx` 移至 `app.tsx`
- **结果**：重新编译后页面内容正常显示，5 个 tab 页均可渲染。
- **学到的教训**：
  - `@babel/preset-react` 的 `runtime: 'automatic'` 是 Taro 4.x 微信小程序编译的关键配置
  - 微信小程序不支持 `gap` CSS 属性，需用 `margin-right` 替代
  - CSS 类和 `var()` 变量在小程序中兼容性差，内联 style + 硬编码颜色值是最可靠的方式

### 40. T11 实现：首页与饮食记录页
- **时间戳**：2026-05-27
- **任务编号**：T11（首页 + 饮食页）
- **阶段**：实现 / TDD
- **触发技能**：`test-driven-development`、`subagent-driven-development`
- **关键上下文**：先写 `lib/api.ts`、`lib/page-data.ts`、`lib/food-search.ts`、`lib/meal-form.ts` 的单元测试，再实现页面组件。
- **动作**：
  - 重写 `lib/api.ts`：去掉 `fetch()`（小程序不支持），替换为内嵌 mock 数据（3 条饮食记录 + 12 种食物 + 健身计划）
  - 提取 `buildHomeDisplay` / `buildDietDisplay` 纯函数到 `lib/page-data.ts`，覆盖加载态、错误态、数据态
  - 提取 `filterFoods` / `formatCalories` 到 `lib/food-search.ts`
  - 提取 `validateMealForm` / `getMealTypeLabel` 到 `lib/meal-form.ts`
  - 先写 18 个测试（`tests/lib/api.test.ts`、`page-data.test.ts`、`food-search.test.ts`、`meal-form.test.ts`），全部通过后再实现页面
  - 实现首页：`useEffect` 加载数据 → `buildHomeDisplay` 转换 → 渲染 kcal/记录数/饮食摘要/计划摘要
  - 实现饮食页：搜索框 → 搜索结果列表 → 点击"+ 记录" → 表单（份量 + 餐次标签 + 确认/取消按钮）→ 添加后实时更新今日汇总
- **结果**：
  - 首页正常显示今日概览和摘要
  - 饮食页"搜索→选择→记录"完整链路可用
  - 测试从 80 个增长到 111 个，全部通过
- **学到的教训**：
  - 把数据转换逻辑提取为纯函数，可以在不依赖 Taro 运行时的情况下写测试
  - 微信小程序 `Input` 的 `onInput` 回调用 `e.detail.value` 取值，不是 `e.target.value`
  - 表单按钮用内联 style 而非 CSS 类，避免小程序样式不生效

### 41. T11 实现：计划页、身体页、我的页
- **时间戳**：2026-05-27
- **任务编号**：T11（计划页 + 身体页 + 我的页）
- **阶段**：实现 / TDD
- **触发技能**：`test-driven-development`、`subagent-driven-development`
- **关键上下文**：完成剩余页面，保持与饮食页一致的交互模式（内联 style、mock API、表单验证）。
- **动作**：
  - 计划页：展示训练计划 + 周安排列表 + 打卡按钮 → 打卡表单 → 打卡历史
  - 身体页：提取 `validateBodyForm` / `computeTrend` 到 `lib/body-data.ts`，先写 8 个测试 → 实现体重/围度记录展示 + 趋势计算 + 添加表单
  - 我的页：目标设置（减脂/维持/增肌）可点击切换，内联 style 实现选中态
  - 在 `lib/api.ts` 中添加 `getBodyMetrics`、`addBodyMetric`、`getWorkoutCheckins`、`addWorkoutCheckin` mock API
- **结果**：
  - 5 个 tab 页全部完成，所有交互可用
  - 测试增长到 119 个，18 个测试文件全绿
  - typecheck 通过，构建成功
- **学到的教训**：
  - 身体数据趋势计算是纯逻辑，应尽量与 UI 分离，方便测试和复用
  - 小程序中 CSS 类名方案在 WeChat 工具中不稳定，全项目统一采用内联 style + 硬编码颜色值
  - 本地添加的数据需要与 mock API 数据合并显示（如饮食汇总 = mock 3 条 + 本地添加 N 条），否则用户会困惑

### 42. T11 收尾：目标设置交互修复
- **时间戳**：2026-05-27
- **任务编号**：T11（收尾）
- **阶段**：UI 修复
- **触发技能**：`systematic-debugging`
- **关键上下文**：用户反馈目标设置标签点击后文字消失、无边框中。
- **动作**：
  - 将目标标签从 CSS 类改为内联 style
  - 选中态：绿色背景 `#07c160` + 白字 + 绿色边框
  - 未选中态：白色背景 + 灰色边框 `#d1d5db` + 深灰文字 `#374151`
- **结果**：目标标签可正常点击切换，选中态文字清晰可见。
- **学到的教训**：WeChat 小程序 CSS 类可靠性低于内联 style，全项目应保持一致的内联 style 策略。

# PLAN.md

> 实现计划：面向大众用户的健康管理小程序风格应用
>
> 目标：用可被单个 subagent 在一次会话内完成的粒度，将系统拆成可并行、可验证、可 TDD 推进的任务。
>
> 约定：
> - 每个 task 都必须先写失败测试，再写最少实现，再重构。
> - 每个 task 都要能独立验证。
> - `SPEC.md` 作为需求基线，任何偏离必须先更新 SPEC 或在任务实现时显式标注。

---

## 任务总览

| Task | 名称 | 依赖 | 可并行 |
|---|---|---|---|
| T1 | 项目脚手架与基础测试框架 | 无 | 否 |
| T2 | 数据模型、认证用户与仓储层 | T1 | 否 |
| T3 | 食物库与搜索 API | T2 | 部分可并行 |
| T4 | 饮食记录 CRUD 与日汇总 | T2 | 与 T3 并行（后续集成需依赖） |
| T5 | 营养统计与目标对比 | T4, T3 | 否 |
| T6 | 自定义食物创建 | T3 | 可与 T4 并行 |
| T7 | 健身计划模板与生成 | T2 | 可与 T3/T4 并行 |
| T8 | 运动打卡 | T7 | 否 |
| T9 | 体重 / 围度记录与趋势 | T2 | 可与 T3/T4 并行 |
| T10 | 基础 AI 推荐生成 | T5, T7, T9 | 否 |
| T11 | 微信小程序风格前端页面（含底部 tab 栏） | T3, T4, T5, T7, T8, T9 | 部分可并行 |
| T12 | 端到端联调、错误状态、验收补强 | T3-T11 | 否 |
| T13 | Docker / CI / 运行文档 | T1-T12 | 可在末期并行 |

---

## T1. 项目脚手架与基础测试框架

### 目标
建立可运行、可测试、可持续迭代的单仓库前后端分层工程基础。T1 已在独立 worktree `feature/t1-scaffold` 中完成。

### 涉及文件
- `package.json`
- `tsconfig.json`
- `src/**`
- `tests/**`
- `vitest.config.*` 或等价测试配置
- `eslint` / `prettier` 配置（如采用）

### 预期实现要点
- 初始化单仓库前后端分层骨架
- 配置 TypeScript、测试框架、lint / format
- 提供最小可运行命令
- 预留模块目录：`foods`、`meal-records`、`stats`、`workout-plans`、`body-metrics`、`recommendations`、`auth`

### 验证步骤
1. 先写一个失败测试，验证测试框架可运行（例如一个简单的纯函数断言）
2. 运行测试，确认起初为红
3. 添加最少代码使测试通过
4. 运行 lint / test 确认基础脚手架稳定

### 结果记录
- 创建了独立 worktree：`feature/t1-scaffold`
- 增加了 `vitest.config.ts`
- 增加了 `tests/scaffold.test.ts`
- 首次 `npm install` 因默认缓存目录权限问题失败，随后通过项目内 cache 解决
- `npm test` 最终通过
- 对应 commit hash：`b7dc38f`

### 依赖
- 无

---

## T2. 数据模型、认证用户与仓储层

### 目标
定义系统核心实体、登录后的用户隔离约束和基础 CRUD 仓储接口，为所有业务模块提供统一数据访问层。T2 已在基于最新 `master` 重新创建的 `feature/t2-domain-repo` worktree 中完成。

### 涉及文件
- `src/domain/**`
- `src/repositories/**`
- `src/types/**`
- `tests/domain/**`

### 预期实现要点
- 定义 `Food`、`MealRecord`、`WorkoutPlan`、`WorkoutCheckin`、`BodyMetric`、`Recommendation`、`User` 类型
- 定义基础仓储接口（内存版即可，后续可替换持久化）
- 规定字段校验规则，如非负数值、必填字段、日期字段
- 统一错误类型：`NotFound`、`ValidationError`、`ConflictError`
- 为用户登录与用户隔离预留清晰的数据边界与查询约束

### 验证步骤
1. 为实体校验写失败测试（如负数体重、空食物名、缺少必填字段）
2. 为仓储读写行为写失败测试（如不存在时读取应报错）
3. 实现最小内存仓储使测试通过
4. 重构为清晰、可复用的 domain / repository 结构

### 结果记录
- 使用独立 worktree `feature/t2-domain-repo`，并在最新 `master` 基线下重新创建
- 先写 `tests/domain/validation.test.ts` 与 `tests/repositories/food-repository.test.ts`
- 补齐 `src/domain/errors.ts`、`src/domain/types.ts`、`src/domain/validation.ts`、`src/foods/preset-foods.ts`、`src/repositories/index.ts`
- 将预置食物数据精确补齐为 100 条，并完成用户隔离与仓储基础校验
- 对应 commit hash：`2b67e5d`

### 依赖
- T1

---

## T3. 食物库与搜索 API

### 目标
实现预置食物库、自定义食物共享搜索入口、关键词搜索和详情查看能力。T3 已在基于最新 `master` 重新创建的 `feature/t3-food-search` worktree 中完成；冷启动验证确认 T3 需要在 T1 → T2 完成后推进，数据库采用 MySQL，预置食物初始数据量为 100 条，单个用户最多可创建 50 个自定义食物。

### 涉及文件
- `src/foods/**`
- `src/api/foods.*`
- `tests/foods/**`

### 预期实现要点
- 内置预置食物数据集（初始规模 100 条常见食物）
- 支持按名称关键词搜索，预置食物与自定义食物共享同一接口
- 搜索结果默认保持简洁，不强制显示来源
- 支持根据 id 获取食物详情
- 支持分页或前 N 条返回（视数据规模）
- 搜索不到时返回空结果而非报错
- 预置食物与自定义食物在数据层保留来源字段，支持重名与可见性判断

### 验证步骤
1. 先写失败测试：关键词可匹配食物名称、空关键词策略、无结果返回空列表
2. 先写失败测试：获取详情时，id 不存在应抛 NotFound
3. 实现最少食物库与搜索逻辑
4. 重构索引方式，保证可维护

### 结果记录
- 先写 `tests/foods/food-service.test.ts`、`tests/repositories/food-repository.test.ts` 和 `tests/api/foods-api.test.ts`
- 补齐 `src/foods/food-service.ts`、`src/api/foods.ts`、`src/repositories/index.ts` 以及预置食物数据
- 修复测试作用域问题与初始化逻辑后，T3 相关测试全部通过
- 对应 commit hash：`84eb9f4`

### 依赖
- T2

### 可并行
- 可与 T4、T7、T9 并行开发，但最终集成时依赖统一 domain 约束

---

## T4. 饮食记录 CRUD 与日汇总

### 目标
实现饮食记录新增、编辑、删除、查询，以及按日维度的独立持久化汇总能力。日汇总作为单独数据结构保存，并在饮食记录变更时立刻更新。T4 已在基于当前 `master` 重新创建的 `feature/t4-meal-records` worktree 中完成。

### 涉及文件
- `src/meal-records/**`
- `src/api/meal-records.*`
- `tests/meal-records/**`

### 预期实现要点
- 新增一条饮食记录时可关联预置食物或自定义食物
- 记录包含餐次、份量、日期、备注
- 支持按日获取记录列表
- 支持编辑与删除记录
- 日汇总作为独立实体持久化保存
- 新增记录时对对应日汇总执行增量更新
- 编辑或删除记录时对对应日期的日汇总执行整天重算
- 当某天最后一条记录被删除后，按设计清理或重建该日汇总

### 验证步骤
1. 先写失败测试：新增记录成功、缺字段失败、份量非法失败
2. 先写失败测试：按日期查询可返回当天记录
3. 先写失败测试：编辑/删除记录后状态更新正确
4. 先写失败测试：新增后日汇总增量更新正确，编辑/删除后整天重算正确
5. 实现最少 CRUD 和聚合逻辑
6. 重构重复校验逻辑

### 结果记录
- 基于当前 `master` 创建独立 worktree `E:/6/ai/last-t4` 和分支 `feature/t4-meal-records`
- 先写 `tests/meal-records/meal-record-service.test.ts` 和 `tests/api/meal-records-api.test.ts`，确认饮食记录与汇总更新的红灯行为
- 补齐 `src/meal-records/meal-record-service.ts`、`src/api/meal-records.ts`、`src/repositories/index.ts`、`src/domain/types.ts` 与相关验证逻辑
- 按用户确认的混合策略实现：新增记录增量更新日汇总，编辑 / 删除对对应日期整天重算
- 补强用户隔离、日期必填、自定义食物归属、日期变更重算等边界，并将对应测试一并加进来
- 最终 `npm test` 与 `npm run typecheck` 均通过，T4 相关测试共 57 个全部通过
- 对应 commit hash：`16d679a`

### 依赖
- T2

### 可并行
- 与 T3、T7、T9 可并行；集成时与 T5 关联

---

## T5. 营养统计与目标对比

### 目标
基于单日饮食记录计算当天热量和核心营养素，并输出简化的目标对比结果。T5 已在基于当前 `master` 重新创建的 `feature/t5-daily-stats` worktree 中完成。

### 涉及文件
- `src/stats/**`
- `src/api/stats.*`
- `tests/stats/**`

### 预期实现要点
- 仅支持“某一天”的热量 / 营养素总汇，不做跨天范围统计
- 汇总热量、蛋白质、脂肪、碳水、纤维、糖、钠
- 支持根据用户目标给出简单状态提示（偏低 / 合适 / 偏高）
- 无记录时返回空状态
- 缺少日期参数、缺少用户头时返回明确错误
- 统计接口与饮食记录接口共享同一内存上下文，确保联调一致

### 验证步骤
1. 先写失败测试：给定某一天的饮食记录后总和应正确
2. 先写失败测试：无记录时返回空状态
3. 先写失败测试：目标对比提示正确
4. 先写失败测试：缺少日期 / 用户头时返回校验错误
5. 实现最少聚合逻辑
6. 重构统计纯函数，保证可测性

### 结果记录
- 基于当前 `master` 创建独立 worktree `E:/6/ai/last-t5` 和分支 `feature/t5-daily-stats`
- 先写 `tests/stats/daily-stats-service.test.ts` 与 `tests/api/stats-api.test.ts`，确认单日统计与空状态的红灯行为
- 补齐 `src/stats/daily-stats-service.ts`、`src/api/stats.ts`，并复用 `meal-records` 的共享上下文数据源
- 按单日口径实现热量与核心营养素总汇，并支持简单目标对比；无记录时返回空状态
- 补强缺少日期、缺少用户头、目标参数边界，并将对应测试一并加进来
- 最终 `npm test` 与 `npm run typecheck` 均通过，T5 相关测试共 62 个全部通过
- 对应 commit hash：`TBD`

### 依赖
- T4、T3

---

## T6. 自定义食物创建

### 目标
支持用户创建自定义食物并纳入搜索与记录流程。T6 已在独立 worktree `E:/6/ai/last-t6` 中完成，并根据用户确认的规则，采用“名称 + 热量 + 蛋白质/脂肪/碳水必填，纤维/糖/钠可选”的输入方式。

### 涉及文件
- `src/foods/**`
- `src/api/foods.*`
- `src/domain/**`
- `tests/foods/**`
- `tests/api/foods-api.test.ts`

### 预期实现要点
- 支持填写名称、热量、蛋白质、脂肪、碳水
- 纤维 / 糖 / 钠允许为空，后端以 `null` 表示缺失值
- 自定义食物创建后立刻可被搜索到
- 自定义食物可与预置食物或其他自定义食物同名
- 自定义食物可在饮食记录中直接选用
- 自定义营养字段为空时，展示与统计模块必须兼容 `null`

### 验证步骤
1. 先写失败测试：合法自定义食物可创建成功
2. 先写失败测试：缺少必填字段、负数值、越界用户配额等处理符合预期
3. 先写失败测试：创建后可立刻出现在搜索结果中
4. 先写失败测试：`null` 营养字段在创建与搜索返回中保持可兼容
5. 实现最少创建流程
6. 重构校验与数据入库逻辑

### 结果记录
- 在 `E:/6/ai/last-t6` worktree 中完成实现
- 调整 `Food` 校验逻辑，允许 `fiberPer100g`、`sugarPer100g`、`sodiumPer100g` 为 `null`
- 调整自定义食物输入 DTO，采用“名称 + 热量 + 蛋白质/脂肪/碳水必填”的规则
- 创建后可立即通过现有搜索接口检索到
- 允许重名，不做名称冲突拦截
- `npm test` 与 `npm run typecheck` 已通过
- 对应 commit hash：`deb25d6`

### 依赖
- T3、T2

### 可并行
- 可与 T4 并行

---

## T7. 健身计划模板与生成

### 目标
实现基础健身计划生成能力，使用规则模板而非高风险自由生成。T7 已在独立 worktree `E:/6/ai/last-t7` 中完成，采用“目标类型 + 每周训练频率”的最小输入规则，输出结构化、可展示、可用于后续打卡引用的训练计划。

### 涉及文件
- `src/workout-plans/**`
- `src/api/workout-plans.*`
- `tests/workout-plans/**`

### 预期实现要点
- 按目标（减脂 / 增肌 / 维持）和频率生成模板计划
- 每个计划包含训练日安排、动作/类型、时长建议
- 输出结构化计划内容，便于前端展示与后续打卡模块引用
- 输入不合法时回退到默认新手计划

### 验证步骤
1. 先写失败测试：不同目标会生成不同模板
2. 先写失败测试：不同频率会生成不同训练安排
3. 先写失败测试：缺少参数时会回退到默认计划
4. 先写失败测试：输出结构满足前端展示需求
5. 实现最少模板生成逻辑
6. 重构模板数据结构

### 结果记录
- 在 `E:/6/ai/last-t7` worktree 中完成实现
- 新增 `WorkoutPlanService`
- 先写 `tests/workout-plans/workout-plan-service.test.ts`，覆盖减脂 / 增肌 / 维持 / 非法频率回退四类场景
- 通过规则模板按频率生成周计划安排
- 使用结构化 `planContent` 承载摘要、周安排和说明
- `npm run typecheck` 与 `npm test` 均通过
- 对应 commit hash：`4a9a3be`

### 依赖
- T2

### 可并行
- 可与 T3、T4、T9 并行

---

## T8. 运动打卡

### 目标
支持用户对计划中的训练项进行每日打卡和状态追踪。T8 已在独立 worktree `E:/6/ai/last-t8` 中完成，采用 `planId + date + note` 的轻量打卡规则，同一天允许多次提交并按时间顺序保留记录。

### 涉及文件
- `src/workout-checkins/**`
- `src/api/workout-checkins.*`
- `tests/workout-checkins/**`
- `src/repositories/**`

### 预期实现要点
- 对某一天的训练项提交完成状态
- 防止重复数据带来混乱，支持按日期区分
- 按 `planId + date` 查询当天所有打卡记录
- 同一天允许多次提交，保留历史
- 备注字段用于记录本次打卡的简短说明

### 验证步骤
1. 先写失败测试：首次打卡成功
2. 先写失败测试：同一天重复打卡按设定策略处理
3. 先写失败测试：按计划查询能看到完成状态
4. 先写失败测试：记录按时间顺序返回
5. 实现最少打卡逻辑
6. 重构查询与聚合

### 结果记录
- 在 `E:/6/ai/last-t8` worktree 中完成实现
- 新增 `WorkoutCheckinService`
- 增补 `WorkoutPlanRepository`、`WorkoutCheckinRepository`，支持按 `planId + date` 查询多条记录
- 先写 `tests/workout-checkins/workout-checkin-service.test.ts`，覆盖首次打卡、重复打卡、按日查询与越权场景
- 同一天重复打卡不报错，记录按时间顺序保留
- `npm run typecheck` 与 `npm test` 均通过
- 对应 commit hash：`b396895`

### 依赖
- T7

---

## T9. 体重 / 围度记录与趋势

### 目标
支持用户记录体重和围度，并查看趋势变化。T9 已在独立 worktree `E:/6/ai/last-t9` 中完成，采用“记录型 CRUD + 简单趋势函数”的方案，允许保存最近记录、与上一条记录的差值以及趋势方向。

### 涉及文件
- `src/body-metrics/**`
- `src/api/body-metrics.*`
- `tests/body-metrics/**`
- `src/repositories/**`

### 预期实现要点
- 支持新增体重记录
- 支持新增围度记录
- 支持按日期范围查询
- 支持简单趋势数据输出
- 保留 `latest / previous / delta / direction` 这种轻量趋势结构

### 验证步骤
1. 先写失败测试：合法身体数据可保存
2. 先写失败测试：非法数值拒绝保存
3. 先写失败测试：按范围查询返回正确排序
4. 先写失败测试：趋势函数可输出最近变化与方向
5. 实现最少 CRUD 与趋势函数
6. 重构数据结构和排序逻辑

### 结果记录
- 在 `E:/6/ai/last-t9` worktree 中完成实现
- 新增 `BodyMetricService`
- 增补 `BodyMetricRepository`，支持按用户和日期范围查询
- 先写 `tests/body-metrics/body-metric-service.test.ts`，覆盖合法保存、非法值、范围查询、趋势与边界场景
- 通过纯函数式趋势输出最近变化、上一条记录和方向
- `npm run typecheck` 与 `npm test` 均通过
- 对应 commit hash：`b579a33`

### 依赖
- T2

### 可并行
- 可与 T3、T4、T7 并行

---

## T10. 基础 AI 推荐生成

### 目标
基于饮食、计划和身体数据生成受约束、可解释、可回退的建议。T10 已在独立 worktree `E:/6/ai/last-t10` 中重新启动，采用方案 B：规则引擎 + 模板化文案；本次不做开放式聊天、不做医疗建议、不做长期记忆，只做一轮结构化推荐生成。输入最小依赖为饮食统计、健身计划、体重趋势和用户目标信息。

### 涉及文件
- `src/recommendations/**`
- `src/api/recommendations.*`
- `tests/recommendations/**`
- `src/domain/**`
- `src/stats/**`
- `src/workout-plans/**`
- `src/body-metrics/**`

### 预期实现要点
- 输入结构化数据后生成饮食建议、运动建议、每日摘要
- 优先使用规则 + 模板 + 结构化提示词
- 数据不足时返回通用建议，且保留可识别的降级标记
- 不输出高风险医疗结论或诊断性措辞
- 推荐输出保持结构化，便于前端展示与后续迭代
- 推荐内容以“原因 + 建议”方式组织，减少空泛结论

### 验证步骤
1. 先写失败测试：给定不同输入时输出类别正确
2. 先写失败测试：数据不足时会触发降级模板
3. 先写失败测试：建议内容包含可解释字段
4. 实现最少推荐生成逻辑
5. 重构提示词构造与规则层

### 结果记录
- 在 `E:/6/ai/last-t10` worktree 中重新启动实现
- 设计采用规则引擎 + 模板化文案，不引入自由聊天；实现上保持单轮生成、结构化输出和可解释建议
- 最小输入收敛为：饮食统计、健身计划、体重趋势、用户目标信息
- 已补齐 `RecommendationService` 与对应测试骨架，并通过 `npm run typecheck` / `npm test`
- 对应 commit hash：`TBD`

### 依赖
- T5、T7、T9

---

## T11. 微信小程序风格前端页面

### 目标
实现与 SPEC 对应的前端页面和交互，保持微信小程序风格。T11 已在独立 worktree `E:/6/ai/last-t11` 中完成。

### 涉及文件
- `src/app.tsx`、`src/app.config.ts`
- `src/pages/home.tsx`、`src/pages/diet.tsx`、`src/pages/plan.tsx`、`src/pages/body.tsx`、`src/pages/me.tsx`
- `src/lib/api.ts`、`src/lib/page-data.ts`、`src/lib/food-search.ts`、`src/lib/meal-form.ts`、`src/lib/body-data.ts`
- `src/styles.css`
- `tests/lib/api.test.ts`、`tests/lib/page-data.test.ts`、`tests/lib/food-search.test.ts`、`tests/lib/meal-form.test.ts`、`tests/lib/body-data.test.ts`
- `config/index.ts`、`babel.config.cjs`、`src/types/css.d.ts`

### 预期实现要点
- 首页 / 今日概览：mock API 加载 kcal、记录数、饮食摘要、计划摘要，覆盖加载态/错误态
- 饮食记录页：搜索食物 → 结果列表 → 选择食物 → 填份量 → 选餐次 → 确认记录，本地添加数据与 mock 数据合并汇总
- 食物搜索：客户端过滤 `filterFoods`，空查询展示前 10 条，支持中文子串匹配
- 健身计划页：展示计划详情 + 周安排列表（每天的训练动作），打卡按钮 → 打卡表单 → 打卡历史
- 运动打卡：集成在计划页，提交打卡后实时更新历史列表
- 身体数据页：最新体重/围度展示 + 趋势计算（delta/direction）+ 历史列表 + 添加表单（体重必填，腰围/备注选填）
- 我的 / 设置页：用户信息展示 + 目标设置（减脂/维持/增肌）可点击切换
- 空状态、错误状态、加载状态：所有数据加载页面均覆盖

### 验证步骤
1. 先写 39 个前端测试（lib/api、page-data、food-search、meal-form、body-data），覆盖数据转换、校验、过滤、趋势计算
2. 微信开发者工具中逐页验证 UI 渲染和交互
3. typecheck 通过，构建成功
4. 注意：T11 使用 mock 数据独立开发，T12 联调时替换为真实后端 API

### 结果记录
- 在 `E:/6/ai/last-t11` worktree 中完成所有 5 个 tab 页的实现
- 发现并修复关键问题：
  - `ReferenceError: React is not defined` → babel `runtime: 'automatic'`
  - WeChat 小程序 CSS `gap` 不支持 → 改用 `margin-right`
  - CSS 类和 `var()` 变量不可靠 → 全项目统一内联 style + 硬编码颜色
  - `fetch()` 在微信小程序中不存在 → mock 数据直接返回
- 前端测试从 80 个增长到 119 个（新增 39 个），18 个测试文件全绿
- 对应技术选型：Taro 4.2 + React 18 + TypeScript，编译目标 weapp

### 依赖
- T3、T4、T5、T7、T8、T9

### 可并行
- 页面骨架可先行，数据联调需依赖后端任务完成

---

## T12. 端到端联调、错误状态、验收补强

### 目标
把各模块串联成完整流程，补齐错误处理、边界场景和验收缺口。T12 已在独立 worktree `E:/6/ai/last-t12` 中完成。

### 涉及文件
- `src/server.ts`、`src/app-context.ts`
- `src/api/workout-checkins.ts`、`src/api/body-metrics.ts`、`src/api/recommendations.ts`（新建）
- `src/api/foods.ts`、`src/api/stats.ts`、`src/api/meal-records.ts`（修改）
- `src/db/connection.ts`、`src/db/schema.ts`、`src/db/seed.ts`（新建）
- `src/lib/api.ts`、`src/lib/page-data.ts`、`src/lib/food-search.ts`、`src/pages/diet.tsx`（修改）
- `Dockerfile`、`docker-compose.yml`、`.dockerignore`、`.github/workflows/ci.yml`（新建）
- `config/index.ts`、`src/index.html`（新建/修改）
- `tests/lib/api.test.ts`、`tests/api/stats-api.test.ts`、`tests/api/meal-records-api.test.ts`（修改）

### 预期实现要点
- 创建 Express Server 入口（`src/server.ts`），挂载 7 个 API 路由 + health check + serve H5 前端
- 补充缺失 API 路由：workout-checkins（GET/POST）、body-metrics（GET/POST）、recommendations（POST）
- MySQL 数据库层：`mysql2` 连接池 + 8 张表 schema + 100 条预置食物 seed + docker-compose（MySQL 8.0）
- 前端 API 层改造：删除 mock 数据，H5 模式用 `fetch()` 调真实后端 API
- 前后端数据格式对齐：stats API 返回扁平格式、meal-records API 空数据返回零值、body-metrics 无数据不抛错
- 完整营养素记录：`FoodItem` 增加全部营养素字段，`computeMealNutrients()` 按份量计算，搜索结果/记录表单/本次添加/今日汇总全部展示完整营养素
- 内存数据预置：100 条食物 + 默认健身计划，MySQL 不可用时自动回退内存模式
- Docker 多阶段构建 + CI（GitHub Actions：typecheck → test → docker build）
- 端到端验证：server 启动 → API 返回数据 → 前端页面正常渲染 → 各页面交互可用

### 验证步骤
1. `npm run build:h5` 构建成功，`dist/` 输出 H5 静态文件
2. `npx tsx src/server.ts` 启动，`curl /api/health` 返回 200
3. 浏览器访问 `http://localhost:3000`，5 个 tab 页正常渲染
4. 搜索食物 → 记录饮食 → 统计更新完整链路
5. 健身计划生成 → 打卡 → 打卡历史
6. 体重/围度记录 → 趋势计算 → 历史列表
7. 空状态、错误状态均有明确反馈
8. `npm run typecheck` 通过，113 个测试全绿

### 结果记录
- 在 `E:/6/ai/last-t12` worktree 中完成所有端到端联调
- 发现并修复关键问题：
  - Express 5 `app.get('*')` 不支持 → 改用 `app.use()`
  - ESM 模式下 `__dirname` 不可用 → `fileURLToPath(import.meta.url)`
  - 内存仓储无 workout plan → `app-context` 初始化时预置
  - Stats API 返回嵌套格式不匹配 → 改为扁平格式
  - body-metrics `getTrend` 无数据抛错 → API 层 catch 返回 null
  - checkin `note` 强制非空 → 改为可选
  - Body metrics POST 缺少 `metricDate` → API 层自动补默认值
  - 本地 meal 蛋白质用 `calories × 0.17` 估算错误 → 改存真实营养素值
  - Alpine 镜像缺少 glibc → Dockerfile 改用 Debian
- 测试保持 113 个全绿，typecheck 通过，构建成功

### 依赖
- T3-T11

---

## T13. Docker / CI / 运行文档

### 目标
完成交付所需的容器化、持续集成与运行说明。T13 已在独立 worktree `E:/6/ai/last-t13` 中完成。

### 涉及文件
- `Dockerfile`（T12 已创建，T13 无修改）
- `docker-compose.yml`（T12 已创建，T13 无修改）
- `.github/workflows/ci.yml`（T12 已创建，T13 修复 CI 兼容性）
- `README.md`（新建）
- `REFLECTION.md`（新建）

### 预期实现要点
- 单条 `docker-compose up` 可运行完整项目（app + MySQL）
- CI 自动执行 typecheck + test + docker build
- README 说明安装、运行、端口、环境变量、目录结构、API 端点
- REFLECTION.md 1500-2500 字反思报告

### 结果记录
- 在 `E:/6/ai/last-t13` worktree 中完成
- README.md：包含 Docker/本地/微信小程序三种运行方式、15 个 API 端点表、目录结构树、技术栈
- REFLECTION.md：约 2200 字，覆盖 9 个课程要求问题
- CI 修复：`npm ci` → `npm install` 解决跨平台兼容；测试 mock 补充营养素字段；API 返回类型从 `unknown` 改为具体类型
- 云部署：阿里云 ECS（Ubuntu 22.04），`docker-compose up -d` 部署，公网地址 `http://47.116.36.135:3000`
- Open Design 120+ 技能全局安装到 Claude Code
- 113 测试全绿，typecheck 通过，构建成功

### 验证步骤
1. `npm run build:h5` 构建成功
2. `docker-compose up -d` 启动 app + MySQL，`curl /api/health` 返回 200
3. 浏览器访问 `http://localhost:3000` → 5 个 tab 页正常
4. 浏览器访问 `http://47.116.36.135:3000` → 云部署正常

### 依赖
- T1-T12

---

## 推荐执行顺序

### 第一阶段：基础与核心域
- T1 → T2 → T3 / T4 / T7 / T9 并行推进

### 第二阶段：统计、录入与扩展
- T5 → T6 → T8 → T10

### 第三阶段：前端与联调
- T11 → T12

### 第四阶段：交付收尾
- T13

---

## Subagent 派发建议

每个 task 建议采用如下 subagent 约束：

- 只允许修改本 task 涉及的文件
- 只允许实现本 task 的单一目标
- 先输出失败测试，再输出实现
- 遇到 spec 不清晰，必须停下来问，不允许猜测扩展范围
- 完成后必须给出：
  - 修改文件列表
  - 测试命令
  - 验证结果
  - 仍未解决的问题

---

## 任务完成标准

一个 task 只有在满足以下条件时才算完成：
- 失败测试已先写出并证明能红
- 最小实现已使测试变绿
- 必要重构已完成
- 与 `SPEC.md` 一致
- 有明确验证命令
- 相关问题已记录到 `AGENT_LOG.md`

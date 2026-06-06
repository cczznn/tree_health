# REFLECTION.md — AI4SE 期末项目反思报告

> 注：本文基于初始版本（T1-T13），由 AI 辅助扩展和润色以反映项目后期变更（T10 升级、分条目打卡、DeepSeek 集成、MySQL 全持久化、活动量、问卷等）。

## 1. Superpowers 技能：什么有用，什么是形式

**真正发挥作用的技能：**

- **brainstorming** 是整个过程最重要的技能。在我最初只说了"健康饮食小程序"六个字的时候，它通过一轮轮追问把我模糊的想法收敛成了一份清晰的设计。后期添加活动量选项、分条目打卡等新功能时，也都启动了 brainstorming 来理清需求和设计。

- **writing-plans** 产出的 task 拆解，覆盖了从脚手架到 Docker 的完整路径。每个 task 都有"目标、涉及文件、验证步骤"，这个模板本身就是在强迫你把"做什么"想清楚再动手。

- **systematic-debugging** 在多个关键问题的排查中很关键：Taro H5 的 `<taro-view-core>` 不渲染 border、复选框 `rpx` 失效、`useEffect` 覆盖 state、API key 文件读取失败等。它强制"先定位根因、再修复"的流程避免了乱试。

- **requesting-code-review** 在第 62 条 AGENT_LOG 后做了一次全项目审查，发现了 `computeMealNutrients` 的份量系数 bug、数据库写入静默失败、端口 NaN 等 6 个 Critical 问题，全部修复。

**形式大于实质的：**

- **dispatching-parallel-agents** 在实际项目中很少真正用到。课程流程是线性的，大多数 task 依赖前一个的输出。虽然 PLAN.md 里标注了"可并行"，但在单人项目中，串行推进的效率往往更高。

- **two-phase code review** 在 subagent 完成后触发。但实践中，review 的产出质量取决于 reviewer 对代码的理解深度。派给 subagent 做 review 和自己读代码做 review，后者更可靠。

## 2. TDD 在 AI 协作下的体感

TDD 在 AI 协作中更多是放大器而非阻碍，但这个结论有前置条件。

**好的方面**：先写测试意味着你必须在 prompt 里把输入/输出/边界条件说清楚，这本身就是一种"规格化"。后端服务层（food-service、meal-record-service、workout-plan-service）的 TDD 体验最好——先写失败的单元测试，再让 AI 写最小实现使测试变绿，再重构。

**不好的方面**：Taro 前端页面的 TDD 体验明显差于后端。纯数据逻辑可以测（`filterFoods`、`validateBodyForm`、`computeTrend`），但 UI 交互（"点击按钮后表单是否出现""复选框绿色对勾是否渲染"）几乎没法在 vitest 里测。前端 TDD 退化为"helper 层 TDD + UI 层手动验证"。

**结论**：TDD 的 ROI 与代码的"可测试性"正相关。纯逻辑层 TDD > 集成层 TDD >> UI 层 TDD。在技术选型时应优先考虑测试友好度——Taro 在这方面的确不如纯 React。

## 3. Subagent 自主性与 Task 颗粒度

单个 subagent 在 2-5 分钟的 task 内表现最稳定，几乎不需要人工干预。一旦 task 超过 15 分钟，subagent 就会开始丢失上下文，出现"忘记前面的实现决定"、"重复实现已有功能"等问题。

**最优颗粒度**：一个 task = 一个清晰的 API endpoint + 对应的 service + 对应的测试。这恰好是 writing-plans 产出的粒度。

**实际情况**：本项目虽然使用了 Superpowers 的 subagent 工作流理念，但大量开发是在同一个 Claude Code 会话中连续推进的。在上下文窗口足够（长 context 模型）的前提下，连续对话模式比"每个 task 新开 subagent"效率更高，因为不需要每次重新灌输项目上下文。但这个模式依赖模型的长上下文能力，换一个上下文窗口小的模型就不适用。

## 4. SPEC/PLAN 质量 vs 实现质量

正相关，但不是线性。SPEC 写得好（T3 食物搜索、T4 饮食记录），实现基本不出错。SPEC 写得含糊（T10 AI 推荐的"结构化规则 + LLM 文本生成"到底怎么结合？），实现会走偏需要纠正。

**最关键的教训：SPEC 需要持续同步。** 项目后期新增了大量功能（自定义食物编辑删除、分条目打卡、活动量选择、注册必填字段扩展、AI 自算热量），每次都是先改代码再补 SPEC。这导致 SPEC 和代码之间存在时间差。如果重做，应该在每个功能完成后立即更新 SPEC，而不是积压到后期批量修改。

**冷启动验证的价值**：课程要求用一个"没参与过 brainstorm 的 agent"来验证 SPEC。陌生的 agent 在 SPEC 没有明文写清楚的地方直接卡住，而这些地方我和主 agent 在 brainstorming 过程中已经有了默契。隐性知识是 spec 质量的最大敌人。

## 5. 最有效的 Prompt / Context 策略

**"先给 context，再给指令"** 是最有效的策略。不是只说"帮我实现 T3"，而是"你要实现 SPEC 第 3.3 节的食物搜索 API，涉及文件 a/b/c，用 TDD，先写失败的测试给我看"。

**带着约束问问题比开放式提问效果好。** "Taro H5 的 View 组件 onClick 不触发，是因为它渲染成了 `<taro-view-core>` 自定义元素吗？"比"按钮点不了怎么办？"得到的有用回答多 10 倍。

**DeepSeek prompt 优化经验**：AI 饮食计划生成的 prompt 经历了多次迭代——从最初"请返回 JSON"到后来加上"每份食物必须包含 protein/fat/carbs 六个字段缺一不可，macros 对象数值必须等于各餐加总"，再到"用 Mifflin-St Jeor 公式自行计算 dailyCalories"。每次迭代都基于 AI 实际输出的偏差来调整约束措辞。强制 JSON 输出（`response_format: { type: 'json_object' }`）+ temperature 0.1 是结构稳定性的关键配置。

## 6. Open Design

本项目使用了 Open Design 的 `frontend-design` 技能来美化全局 CSS 样式。它帮助建立了一套"Warm Wellness"设计方向——暖灰背景、柔和阴影、绿色强调色、更大的圆角和间距、毛玻璃 Tab bar。整体视觉从功能性的"能用"提升到了有设计感的"好看"。

但 Open Design 的生成结果（完整 HTML/CSS 页面）不能直接用于 Taro 项目，需要人工将设计 token 转换适配到 Taro 的 `styles.css` 和内联 style 体系。这个转换过程约消耗 30 分钟。对于纯 React/Vue 项目，Open Design 的价值会更大——可以直接生成组件代码。

**反思**：Open Design 最大的价值不是生成代码本身，而是提供一个明确的设计方向（"Warm Wellness"），避免了 AI 生成界面"千篇一律"的问题。但它在 Taro/小程序场景下的适配成本较高，更适合标准 Web 项目。

## 7. 如果重做，会改什么

1. **SPEC 写完做 RFC**。哪怕只找一个人用 30 分钟读一遍、提两个问题，都能暴露出多处"我以为写清楚了但其实没写"的地方。

2. **前端技术选型更早确定**。项目从微信小程序目标变成了 H5 Web 模式，期间经历了大量 Taro H5 兼容性踩坑（`rpx` 内联失效、`<taro-view-core>` 不渲染 border、className 传递问题、gap 属性不转换）。如果一开始就确定"H5 优先"，选型会更从容。

3. **不跳过 CI 验证**。本地能过的测试，push 到 GitHub Actions 就挂了（Windows vs Ubuntu 的 package-lock 兼容问题）。从第一个 PR 就启用 CI 是更稳妥的做法。

4. **SPEC 实时同步而非批量修补**。代码变更和 SPEC 更新应该同步进行，间隔越短越好。

5. **数据库选型更果断**。项目在"内存存储"和"MySQL"之间来回跳，虽然后来实现了 MySQL 全持久化（6 个业务表），但中间几次"为什么重启后数据丢失"的问题都是因为这个双模式架构。如果一开始就锚定 MySQL，代码更干净。

## 8. 对 Superpowers 方法论的批判

Superpowers 的核心假设是：**如果能用流程约束 AI 的行为，AI 的产出就会更可靠。**

这个假设在我的项目里大部分成立。brainstorming → writing-plans → TDD → subagent 这条链确实把"从想法到代码"的过程结构化了。最明显的证据是后端部分：按流程推进的 task 都有测试、有 commit，几乎没有因为 AI 乱写导致的返工。

**但不成立的地方也有。** Superpowers 假设 subagent 每次都能独立完成任务，且产出质量可控。但实际上 subagent 的能力上限就是模型的能力上限。对于"写一个 Express route"这种标准任务，它做得好；对于"设计一套完整的 AI 推荐规则"这种需要领域判断的任务，它的产出需要大量人工修正。流程可以管住纪律，但管不住质量——质量的底线仍然是人的判断。

**另一个问题是前置成本。** 前 70% 的时间花在 SPEC、PLAN、process 文档上，后 30% 的时间才是写代码。如果你的目标是真的做一个有价值的软件，这个投资是值得的。但如果目标只是快速出一个原型，这套流程就是杀鸡用牛刀。

## 9. 对 AI4SE 工具与方法论的整体看法

这门课最核心的收获不是"学会了用 Superpowers"，而是理解了"人 + AI"协作模式下，人的价值在哪里。

AI 能写出 80 分的代码，但定义"80 分是什么"（spec 的清晰度）、判断"代码是否真的有 80 分"（review 的质量）、决定"这 80 分够不够"（验收标准）——这些仍然是人做的事，而且 AI 越强，这些事越重要。

当前 AI4SE 工具最大的瓶颈不是模型能力，而是上下文管理。在一个持续数天、几十个 commit 的项目里，每次新的对话都需要重新建立上下文。课程要求的 SPEC/PLAN/AGENT_LOG 本质上就是一个"可传递给无上下文 agent 的最小子集"。这个模式很原始，但它比"把所有上下文塞进 prompt"更可靠。

**本项目的特殊性在于**：我使用了 Claude Code 的长上下文能力，在一个连续会话中推进了大量开发工作（从 T10 升级到各种功能增强）。这种模式介于"单次 subagent"和"持续结对编程"之间，是当前模型能力下效率最高的方式。但它对模型的长上下文窗口有强依赖——上下文窗口不够时，这个模式会崩塌。

未来我希望看到的不是更强的代码生成模型，而是更好的项目级记忆：agent 能记住项目的所有决定、trade-off、约定，不需要每次重新灌输。SPEC.md 是一个粗糙的雏形，但它指向了正确的方向。

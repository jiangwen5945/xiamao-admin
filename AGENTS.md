# AGENTS.md — 瞎猫管理系统 (xiamao-admin)

基于 Vue 2 + Element UI 2.x 的中后台管理面板，Vue CLI 5 (Webpack 5) 构建，Options API 风格。

## 技术栈

| 领域      | 选型                              |
| --------- | --------------------------------- |
| 前端框架  | Vue 2.6 (Options API)             |
| 构建工具  | Vue CLI 5                         |
| UI 组件库 | Element UI 2.x                    |
| 状态管理  | Vuex 3                            |
| 路由      | Vue Router 3 (动态路由)           |
| CSS       | SCSS + CSS 变量 (暗色/亮色双主题) |
| HTTP      | Axios                             |
| 工具库    | dayjs, js-cookie, @vueuse/core    |
| 部署      | Cloudflare Pages (Wrangler)       |

## 关键命令

```bash
npm run serve      # 本地开发，devServer 代理 /api → http://localhost:3000
npm run build      # 生产构建，publicPath: './'，启用 gzip + bundle 分析
npm run lint       # ESLint 检查（注意 lintOnSave: false，开发时不自动检查）
npm run deploy:cf  # wrangler pages deploy dist --project-name xiamao-admin
```

没有测试框架，不要运行 `npm test`。

## 架构要点

### 动态路由

路由不由前端硬编码，后端返回菜单树（含 `component` 字段指向 `src/view/` 下的路径），通过 `store/modules/tab.js:addMenuToRouter` 动态注册。`resetRouter()` 会重建路由实例避免重复定义。页面入口：`Login.vue` + `Main.vue`（只有一个 `<router-view />` 子路由容器）。

### API 层

- 所有接口定义在 `src/api/index.js`，通过 `this.$api.xxx()` 调用
- Axios 实例 baseURL `/api`，devServer 将 `/api/user` 重写为 `/user` 转发到后端
- Token 从 Cookie 的 `token` 字段读取，请求头带 `Authorization: Bearer <token>`
- 响应格式 `{ code, data, message }`，拦截器在 `code === 200` 时仅返回 `data`
- 后端项目地址在`/Users/jiangwen/Desktop/server`，联调时查看其路由/控制器/模型定义来确认数据结构。不要参考 `mock/` 目录下的 Mock 数据，已过期不准确。

### Vuex

- `tab` 模块（无 namespaced）：isCollapse / navList / crumbsList / menuArray / 动态路由
- `setting` 模块（namespaced: true）：theme / isFullScreen / isLockScreen

## 目录结构

```
src/
├── api/index.js             # API 接口封装
├── App.vue                  # 根组件
├── assets/                  # 静态资源
├── components/              # 全局公用组件
│   ├── TheMenu.vue          # 侧边栏菜单
│   ├── TheHeader.vue        # 顶部导航
│   ├── TheNav.vue           # 标签页导航
│   ├── LockScreen.vue       # 锁屏组件
│   ├── CommonExcel.vue      # Excel 导入导出
│   └── filter/              # 筛选组件
├── main.js                  # 应用入口
├── mixin/index.js           # 全局 mixin
├── router/index.js          # 路由 + 导航守卫
├── store/
│   ├── index.js             # Vuex 实例
│   └── modules/
│       ├── tab.js           # 菜单/标签页/动态路由
│       └── setting.js       # 主题/全屏/锁屏
├── styles/                  # 全局样式/主题
├── utils/                   # 工具函数
│   ├── request.js           # Axios 封装
│   ├── rules.js             # 校验规则
│   ├── format.js            # 格式化
│   ├── hash.js              # 哈希
│   └── map_permission.js    # 权限映射
├── vendor/                  # 第三方工具
└── view/                    # 页面视图
    ├── Login.vue
    ├── Main.vue
    ├── Error.vue
    ├── member-center.vue
    ├── home/index.vue
    ├── product/
    ├── order/
    ├── member/
    ├── stock/
    └── system/ (user/role/menu/department)
```

## Vue 组件规范

- Options API 风格（`export default { name, components, data, computed, methods, filters }`）
- 文件名 kebab-case（`member-list.vue`），组件 name PascalCase（`MemberList`）
- 注释用中文，不添加多余注释
- `<style scoped lang="scss">` 写样式

## CRUD 列表页标准模板

每个列表页遵循统一模式：

```js
const QUERY_PARAM = {
  page: 1,
  pageSize: 10,
  // ...筛选字段
}
const createDefaultForm = () => ({...})

export default {
  name: 'XxxList',
  components: { FilterBar, FilterBarItem },
  data() {
    return {
      tableData: [],
      total: 0,
      isVisible: false,
      modalType: 0,
      form: createDefaultForm(),
      queryParam: { ...QUERY_PARAM },
      formRules: { ... },
      selectedIds: [],
    }
  },
  created() { this.getList() },
  activated() { this.getList() },
  methods: {
    async getList() { ... },
    handleCurrentChange(page) { ... },
    handleQuery() { ... },
    handleReset() { ... },
    handleSelectionChange(rows) { ... },
    handleDelete(ids) { ... },
    handleEdit(row) { ... },
    handleAdd() { ... },
    async submit() { ... },
    handleClose() { ... },
  }
}
```

## 页面编码约定

- API 调用优先用 `this.$api.xxx()`
- 每个页面有 `QUERY_PARAM` 常量和 `createDefaultForm()` 工厂函数
- 筛选用 `<FilterBar>` + `<FilterBarItem>` 组件
- 列表页需在 `created()` 和 `activated()`（keep-alive 刷新）中调用 `getList()`
- 发请求前剔除空参数（`''`/`null`/`undefined`/空数组）
- 新增/编辑用 `el-dialog`，详情用 `el-drawer`
- `modalType: 0` 新增，`modalType: 1` 编辑
- 接口返回的时间字段统一用 `dayjs()` 处理后再展示
- el-table-column 除了操作栏，不要设置 `width`，使用自适应宽度

## 变更日志

- 根目录下的 `CHANGELOG.md` 记录项目所有重要变更
- 格式遵循 [Keep a Changelog](https://keepachangelog.com/) 规范
- 每次提交代码前，在 `CHANGELOG.md` 的 `Unreleased` 章节追加当前变更记录
- 版本发布时将 `Unreleased` 内容归档到对应版本号下
- 变更类型：`feat`（新功能）、`fix`（修复）、`refactor`（重构）、`docs`（文档）、`chore`（杂项）

## API 路径格式

| 动作 | 方法 | 路径            |
| ---- | ---- | --------------- |
| 列表 | GET  | `/xxx/list`   |
| 详情 | GET  | `/xxx/detail` |
| 新增 | POST | `/xxx/add`    |
| 编辑 | POST | `/xxx/update` |
| 删除 | POST | `/xxx/delete` |

## AI 辅助开发工作流

### AI 职责边界

**AI 可以做：**
- 生成代码（新页面、新组件、新功能）
- 审查代码并提出优化建议
- 定位并修复 Bug
- 重构（组件拆分、命名统一、模式提取等）
- 技术调研与方案对比
- 维护文档（CHANGELOG、README 等）
- 通过 `create-menu` skill 操作数据库菜单

**AI 不可以做：**
- 未经确认直接改核心配置（`vue.config.js`、`package.json` scripts）
- 使用 `console.log` 调试（用 `debugger`，提交前清理）
- 用 `@ts-ignore` / `@ts-expect-error` 逃课（确实绕不过要加说明）
- 删除文件或代码块（需用户确认）
- 提交代码到 git（需用户明确指令）
- 在不了解上下文的情况下直接动手改代码（先查再动）

### 任务分类与路由

| 任务类型 | 标准流程 |
|---------|---------|
| **新功能/新页面** | 先读 AGENTS.md 了解规范 → 找现有类似页面做参考 → 按 CRUD 模板/组件规范生成代码 → 检查命名、类型、风格一致性 |
| **修 Bug** | 最小化修复，不改无关代码 → 修复后确认不引入新问题 → 加必要注释说明原因 |
| **重构** | 先评估影响范围 → 保持对外接口不变 → 逐步替换，不一次大改 → 重构完验证功能正常 |
| **技术调研** | 先查项目内部有没有类似实现 → 再到外部查文档/示例 → 给出结论和推荐方案，**不改代码** |

**关键原则：**
- 先读文件再动手，不猜已有代码的结构
- 新功能看相似实现，找项目里最像的页面做模板
- Bug 修复只动病灶，不顺便做重构
- 涉及前端+后端，同时看两个项目的代码再出方案

### 代码质量门禁

AI 生成或修改代码后的自检标准：

```
□ 类型安全：不用 any 逃课，用 any 要加说明（临时占位可接受）
□ 错误处理：有 try 就有 catch，catch 不空
□ 无调试残留：没有 console.log，有 debugger 要清理
□ 风格匹配：遵循本文件中的组件规范、命名规范、CRUD 模板
□ 代码体积：单个组件不超过 300 行，超过考虑拆分
□ 不变更无关文件：只动任务涉及的文件
□ 引用一致：用 this.$api.xxx() 而不是直接 import api
□ 时间处理：接口返回的时间字段用 dayjs() 处理后再展示
```

### 前后端协作规则

后端项目地址：`/Users/jiangwen/Desktop/server`

1. **确认数据结构** — 读后端 controller/model，确认 API 路径、请求参数、响应格式。不参考 `mock/`（已过期）
2. **后端先到位**（如果需要）— 实现 API + 数据库操作，确保能用 curl/Postman 调通
3. **前端对接** — `src/api/index.js` 加接口定义，页面调用 `this.$api.xxx()`，处理后端返回的数据格式
4. **联调确认** — 检查 proxy 正确转发（`/api/user` → `/user`），检查 token 带上了（`Authorization: Bearer xxx`）

### 数据库操作规范

- **菜单管理**：用 `create-menu` skill，通过 Node 脚本或 SQL 操作 `menu` / `role_menu` 表
- **数据查询**：直接用 Node 脚本或 SQL 查数据库，不走 mock
- **生产数据安全**：SELECT 随意，INSERT/UPDATE/DELETE 必须先确认 SQL 内容
- **表结构变更**：通过 Sequelize model 或 migration，需用户确认

### 沟通约定

- 全程中文交流
- 指令明确，不用绕弯子
- 提需求时尽量带涉及的文件路径或页面名
- AI 不确定时先问清楚再动手，不猜用户意图
- AI 不解释用户没问的内容，不刷屏
- 用户直接纠正，不用客气

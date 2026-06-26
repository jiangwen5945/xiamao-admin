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

## Git 提交规范

提交信息格式：`<type>: <中文简述>`，可选换行后逐条列出具体改动。

`type` 使用英文小写：`feat` / `fix` / `refactor` / `style` / `docs` / `chore`

## API 路径格式

| 动作 | 方法 | 路径            |
| ---- | ---- | --------------- |
| 列表 | GET  | `/xxx/list`   |
| 详情 | GET  | `/xxx/detail` |
| 新增 | POST | `/xxx/add`    |
| 编辑 | POST | `/xxx/update` |
| 删除 | POST | `/xxx/delete` |

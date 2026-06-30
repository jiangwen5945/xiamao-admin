# 变更日志

## [Unreleased]

### refactor
- 订单履约流程重构：发货列表只负责发货，订单列表负责确认收货；发货列表"运输中"/"已签收"合并为"已发货"只读 tab
- shipped-tab 移除签收按钮，改为只读展示；delivery-list 由 3 tab 改为 2 tab（待发货/已发货）
- 后端 signLogistics 不再自动完成订单，订单确认收货统一由 order-list 的 confirmOrder 控制
- 订单列表"去发货"按钮携带 order_id 参数跳转到发货页，发货页自动填充订单号搜索
- 售后流程约束：退货退款（type=1）禁止直接"完成操作"，强制走退货签收入库流程，避免库存丢失；仅退款（type=3）保持原有"完成操作"按钮
- return-list 去掉"全部"tab，默认显示"待退货"tab
- delivery-list 将 pending-tab/shipped-tab 的 FilterBar 提取到父级容器，统一筛选栏
- 移除全局 mixin（`src/mixin/index.js`），零引用死代码
- Vuex tab 模块重构：mutation 纯化（仅修改 state），localStorage 写入和路由操作迁移到 action；state 初始化直接从 localStorage 读取，消除状态不同步

### refactor
- 新增 `src/utils/helpers.js`：`cleanParams()` 工具函数，统一清理查询参数中的空值（''/null/undefined/空数组）
- 替换 17 个页面的 `Object.keys(params).forEach` 手写清理逻辑为 `cleanParams()` 调用（member-list, product-list, product-review, order-list, after-sales-list, banner-list, article-list, coupon-list, flash-sale-list, template-list, message-list, finance-list, return-list, log/index, pending-tab, shipped-tab）
- 新增 `loading` 状态：banner-list, article-list, flash-sale-list, coupon-list, template-list, message-list, stock-list 等页面

### fix
- 修复 Axios 响应拦截器错误处理：非 200 状态码和网络异常改为 `Promise.reject` 而非返回空对象，使页面级 `catch` 块生效，消除成功提示在 API 失败时误触发的 Bug
- 页面级错误处理统一规范化（覆盖 25+ 文件）：
  - `async getList()` 统一包裹 `try/catch`，确保异常时不产生未处理的 Promise rejection
  - `async submit()` 统一包裹 `try/catch/finally`，防止重复提交/操作失败无反馈
  - 批量删除操作从 Promise 链（`.then().catch()`）统一改为 `async/await + try/catch`，消除 `$confirm` 取消与 API 错误混在同一个 catch 中的问题
  - 所有空 catch 块补充注释，无法恢复的空 catch 标记为"错误已在拦截器中处理"
  - `Login.vue` catch 补充用户可见错误提示
  - 修复 `loadExpressCompany`、`loadTypes`、`loadAddressList` 等辅助方法中的静默空 catch
  - 处理状态切换（toggleStatus/toggleTop）、发送消息、表单提交等操作的未保护 await 调用

### refactor
- 移除 `src/api/index.js` 中 10 个未使用的 API 定义
- 合并重复 API：`getNotifications`/`readNotification` → `getSiteMessageList`/`markSiteMessageRead`；`detail` → `getUserDetail`
- 清理 5 处 `console.log` 调试输出（LockScreen, product-list, role/index, user/index）

### fix
- 后端安全加固：
  - JWT secret 从硬编码移至 `process.env.JWT_SECRET`
  - `middleware/auth.js` 鉴权中间件覆盖 11 个路由文件（user, product, category, review, department, address, banner, article, stock, system-config, after-sales）
  - 用户/菜单控制器防批量赋值：显式白名单 `ALLOWED_FIELDS`
- 后端基础设施加固：
  - 添加 `@koa/cors` CORS 支持（`ALLOWED_ORIGIN` 环境变量可配置）
  - 添加 `koa-helmet` 安全头
  - 添加 `koa-ratelimit` 限流（全局限流 60s 内 20 次）
  - `controller/upload.js` 上传文件 MIME 类型校验（仅允许 jpg/png/gif/webp）
  - `views/error.pug` 生产环境隐藏堆栈信息
  - `app.js` koa-onerror 生产环境返回 JSON
  - MySQL 连接配置移至环境变量（`DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`）
  - Pug 从 `^2.0.3` 升级至 `^3.0.3` 修复安全漏洞
- 前端安全加固：
  - 安装 `dompurify`，注册 `Vue.prototype.$sanitize` 全局方法
  - `product-list.vue`/`article-list.vue` v-html 渲染经过 DOMPurify 消毒
  - 用户新建默认密码从固定 `123456` 改为随机生成
  - `vue.config.js` 添加 CSP 策略（default-src 'self'，阻止 XSS 注入）

### refactor
- API 定义瘦身：移除 10 个从未调用的死代码 API（`getData`、`signLogistics`、`addReturn`、`getReturnDetail`、`getLogisticsDetail`、`getCouponDetail`、`getBannerDetail`、`getLogDetail`、`getNotificationTemplateDetail`、`getSiteMessageDetail`）
- 合并重复的站内信 API：`getNotifications`/`readNotification` 改用 `getSiteMessageList`/`markSiteMessageRead`（相同端点），同步更新 TheHeader.vue
- 合并重复的用户详情 API：`detail` 改用 `getUserDetail`，同步更新 member-center.vue
- `src/api/index.js` 从 465 行缩减至 421 行

### chore
- 清理所有遗留调试代码（5 处 `console.log`）：`LockScreen.vue`（prerender）、`product-list.vue`（payload）、`role/index.vue`（menuList/cloneRow）、`user/index.vue`（上传头像）

### refactor
- CommonExcel 整体重构：新增 `columns` prop 支持自定义模板格式化导出、`onImport` prop 解耦导入逻辑、`importText`/`exportText` prop 可配置按钮文案
- CommonExcel 移除死代码：`getTableHeader`/`generateData`/`formatExcelDate`/`excelData`/`readerData`，消除 `this.$parent` 紧耦合
- CommonExcel 导出/导入全程包裹 `loading` emit，用户可感知操作状态
- CommonExcel 导入增加错误处理：`FileReader.onerror` reject、`XLSX.read` 异常 catch、文件类型检测增加扩展名兜底兼容性
- product-list 迁入导入逻辑：`onImport` 回调中调用 `importExcel` + 结果展示 + 刷新列表
- stock-list：移除无用字段"锁定库存"（列表列 + 详情抽屉）
- finance-list：顶部导出改用 CommonExcel + columns，移除自定义 `handleExportList` 方法

### fix
- 修复对账订单明细查询日期边界问题：`end` 日期 +1 天改为 `[Op.lt]` 查询，避免漏掉期末当天非零点的订单 (`controller/finance.js`)
- 前端对账订单明细 `loadItems` 增加 `catch` 错误处理，API 失败时表格不再静默为空 (`finance-list.vue`)
- 修复生成对账弹窗日报/月报日期不一致：日报只显示单个日期选择器并自动对齐 `end_date`，月报保持起止日期 (`finance-list.vue`)
- 后端 `generate` 增加日报起止日期一致性校验（`start_date === end_date`）(`controller/finance.js`)
- 后端 `generate` 改为幂等更新：同周期已存在时覆盖数据而非拒绝，支持刷新对账 (`controller/finance.js`)

### feat
- 后端新增 `POST /importExcel` 接口，支持 Excel 导入商品（通过 `CommonExcel` 组件上传）
- 前端生成商品导入 Excel 模版（`src/assets/商品导入模版.xlsx`）及生成脚本
- `CommonExcel` 改用 `:http-request` 接管上传，走 Axios 封装接口，修复 401 问题
- `CommonExcel` 导入后展示详细结果（成功/失败数量 + 失败原因）
- 修正导入模版分类名与数据库一致（电子产品/服装鞋帽/食品饮料/家居生活/图书文具）
- 导入模版补充图片链接、规格(JSON)、详情列；后端新增 images/specs/detail 字段解析
- 清空商品数据库，导入模版替换为武林外传主题商品（10个角色相关商品）
- 导入模版扩展为 50 条，排序全部归 0，所有商品均含图片链接
- `scripts/generate-orders.js`：清空旧订单相关数据，补库存，生成 73 条近一个月测试订单（状态覆盖 0-6）
- 运行 `seed-finance.js` + 补生日对账：`finance_summary` 现含 1 条月度 + 16 条日对账记录
- 移除 `mock/` 目录及 `mockjs` 依赖，清理 `main.js` 和 `.env.development` 中 mock 引用

### fix
- 前端 Axios 响应拦截器新增 401 处理：清除 token、弹出提示、跳转登录页
- 后端 JWT token 过期时间从 7d 改为 30s（测试用）
- 修复接口请求失败后页面报错 `Cannot read properties of undefined (reading 'list')`：拦截器不再返回 `undefined`，业务错误 / 网络错误统一返回空对象 `{}`
- 修复 token 过期时并发请求导致多条重复提示：增加 `isRedirecting` 标志位，首次 401 触发跳转后后续请求静默返回

### feat
- 订单列表增加创建时间和支付时间日期范围筛选（后端 `adminList` + 前端日期选择器）
- 移除 `StockMovement.type` 中未使用的 `'out'` 类型（Model + 数据库 ENUM）
- 售后完成后订单标记为"已退款"（status=5），自动修复财务总览中 `total_income` 包含已退款订单的问题
- 退货物流模块改造：退货退款审核通过时自动创建退货记录，`after_sales_id` 联动售后单与退货单
- 后端 `/logistics/return/list` 新增 `after_sales_id` 筛选参数，支持按售后单查询退货记录
- 退货列表页改为 TAB 布局（全部/待退货/退货中/已签收/已入库），去掉手动"新增退货"功能
- 售后列表页新增"退货物流"入口按钮，跳转到关联的退货单（仅退货退款类型+已审核状态）
- 新增订单支付功能：后端 `order.pay` 方法，前端订单列表待付款行增加"支付"按钮
- 新增物流虚拟发货功能：后端 `logistics.virtualShip` 方法，直接创建已签收物流记录 + 订单直达已完成
- 新增售后完成操作：后端 `after-sales.admin/complete` 接口，售后单可从审核通过推进到已完成
- 新增后台发起售后：后端 `after-sales.admin/apply` 接口 + 前端订单列表已完成订单增加"售后"按钮和弹窗
- 新增退货入库自动恢复库存：`logistics/return/warehousing` 入库时自动回补库存并完成售后

### feat
- 售后订单状态管理：发起售后后订单标记为"售后中"（status=6），拒绝恢复为"已完成"（status=3），完成标记为"已退款"（status=5）
- 后端 `adminApply` 自动补全售后商品：前端未传 `items` 时从订单商品快照获取，修复 `afterSale.items is not iterable` 错误
- 全端列表新增"售后中"（status=6）状态展示和筛选

### fix
- 修复退货入库库存永久亏损问题：入库时遍历商品项，恢复库存量并创建 StockMovement 记录（type=return_in）
- 修复下单扣库存 StockMovement.order_id 为 null：改为先生成订单再扣库存，确保 order_id 关联到正确的订单
- 移除售后类型中的"换货"选项，仅保留"退货退款"和"仅退款"

### refactor
- 移除订单列表确认收货按钮，所有订单履约入口统一到物流页
- 新增退货单管理模块（物流管理下），含后端 CRUD 接口、前端列表页、数据库菜单
- 新增商品评价管理模块，含后端 CRUD 接口、前端列表页（列表/审核/回复/删除）、数据库菜单
- 新增内容管理模块（Banner 管理 + 公告管理），含后端 CRUD 接口、前端列表页（Banner 列表/排序/图片上传/启用禁用、公告列表/置顶/富文本编辑/发布下线）、数据库菜单
- 新增系统配置模块，含后端 key-value 配置存储、前端配置页（基础设置/订单设置/运费设置分组 Tab）、数据库菜单

### fix
- 修复对账列表导出：改为前端生成双 Sheet xlsx 代替 CSV，解决 Excel 行列错乱问题
- 修复对账导出接口未处理 HTTP 错误状态码，避免错误 JSON 被下载为 CSV 文件
- 移除对账列表导出相关无用代码（前端 financeExport API + 后端 /finance/export 路由和控制器）

### docs
- 补充 AI 辅助开发工作流规范（AGENTS.md 新增「AI 辅助开发工作流」章节）

### chore
- 补充编码规范，更新工具配置

## [0.2.0] - 2026-06-27

### feat
- 重新设计登录页面，增加动画效果和暗色模式适配
- 新增财务管理、物流管理、系统字典模块及 API
- 新增消息通知模块（模板管理+站内信）及菜单图标动态获取
- 新增售后管理模块

### fix
- 修复 Main.vue 布局嵌套问题，优化菜单和仪表盘样式
- 菜单新增/编辑/删除后同步刷新侧边栏缓存

### refactor
- 重构订单管理模块，优化新建订单流程和详情展示
- 规范组件命名

## [0.1.1] - 2026-06-25

### feat
- 移除商品列表的库存字段，新增库存管理模块

### fix
- 锁屏密码存储从 sessionStorage 改为 localStorage，避免关闭标签页后丢失

### refactor
- 统一分页参数命名，重构仪表盘首页，新增会员等级管理
- 清理废弃代码和文件，优化商品列表表单布局与编辑功能
- 提取表单常量为工厂函数，统一 CRUD 组件模式

## [0.1.0] - 2026-06-24

### feat
- 新增会员管理模块及相关优化
- 引入 dayjs 优化 CommonExcel 组件日期处理
- 添加搜索模块公共组件
- 菜单管理支持 show_sidebar 字段
- 侧边菜单根据 show_sidebar 字段过滤
- 新增用户详情 API 接口
- 用户管理新增部门字段
- 用户管理模块功能增强和体验优化
- 处理用户表编辑时的角色

### fix
- 登录后自动设置当前角色为第一个角色并修复路由守卫报错
- menu/list 接口补全会员管理菜单项
- 调整用户列表表格样式和分页大小
- 修复角色菜单编辑时级联勾选和缓存刷新问题
- 修复分页问题
- 调整原有字段名与接口的差异
- 调整错误的抛出；锁屏组件密码错误时不解锁

### refactor
- 合并 handleBatchDelete 和 handleDelete 方法
- 重构商品模块，规范化 API 路径并简化分类管理页面
- 抽取 FilterBar 和 FilterBarItem 公共筛选栏组件
- 优化用户管理状态显示与编辑
- 优化角色切换交互
- 优化 MemberCenter 组件代码结构与布局
- 优化 CommonHeader 组件，移除无效代码，新增角色切换功能
- 用户管理新增部门字段；锁屏组件显示当前角色
- 统一角色字段命名（title→name），修复菜单路由懒加载空值问题
- 菜单管理改用扁平数据+树形结构，角色管理集成 el-tree 菜单权限
- 重构菜单管理页面：移除 mixin、改为树形表格、更新表单字段
- 数据接入 node 后端改造 v1.0

## [0.0.2] - 2026-06-10

### feat
- 添加 Cloudflare Pages 部署脚本
- 新增个人中心模块
- 新增文件管理模块
- 新增菜单管理的图标选项
- 新增屏幕内容保护；头部时间显示；统一规范 vuex 代码风格
- 添加表格的导入导出功能
- 完善文章模块
- 主题切换功能

### fix
- 替换 node-sass 为 sass，兼容 Node.js v22
- 修复 lockScreen 浏览器刷新后消失的问题
- 修复 username 变量名错误
- 修复图标更新无效
- 修复登录页未通过校验可以登录问题
- 修复面包屑已知问题

### refactor
- 修改面包屑实现方式，优化已知问题
- 项目结构调整
- 侧边栏图标修改，添加订单管理页面
- 统一添加表单校验
- 统一规范 vuex 代码风格
- 优化登录功能
- 优化启动屏幕锁定时的安全防护
- 修改解锁文字为图标

### chore
- 取消浏览器 input 自动填充
- 添加 keep-alive 缓存组件优化
- 关闭源码视图；开启 gzip
- 设置本地代理

## [0.0.1] - 2026-06-07

### feat
- 项目初始化，基础框架搭建

### chore
- first commit

---

格式遵循 [Keep a Changelog](https://keepachangelog.com/) 规范。

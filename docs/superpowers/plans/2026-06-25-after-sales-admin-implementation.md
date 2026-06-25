# 售后管理模块（管理端）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在后台新增售后管理页面，支持售后单列表查询和审核操作

**Architecture:** 在现有 CRUD 模板（参考 `order-list.vue`）基础上新增 `after-sales-list.vue` 页面，并在 `api/index.js` 追加 3 个 API 函数

**Tech Stack:** Vue 2 + Element UI 2.x, Options API, Axios

---

### Task 1: API 层 — 追加售后相关接口

**Files:**
- Modify: `src/api/index.js` — 在文件末尾、`deleteLog` 之前添加

- [ ] **追加 3 个 API 函数**

```js
// 售后
export const getAfterSalesList = (params) => {
  return http.get("/after-sales/admin/list", { params });
};
export const approveAfterSales = (data) => {
  return http.post("/after-sales/admin/approve", data);
};
export const rejectAfterSales = (data) => {
  return http.post("/after-sales/admin/reject", data);
};
```

- [ ] **Commit**

### Task 2: 页面组件 — after-sales-list.vue（完整页面）

**Files:**
- Create: `src/view/after-sales/after-sales-list.vue`

该文件按以下结构实现：

- **模板**：FilterBar 筛选栏 → table-header 操作栏（仅刷新按钮） → el-table 数据表格 → el-pagination 分页 → el-dialog 审核弹窗 → el-drawer 详情抽屉
- **脚本**：遵循 order-list.vue 的完整 CRUD 模板模式
- **样式**：scoped SCSS，复用 `drawer-body`、`dialog-form`、`form-row` 等 class

详情：
1. 筛选栏：3 个 FilterBarItem（状态 el-select、类型 el-select、订单号 el-input）
2. 表格：售后单ID/订单号/会员/类型标签/状态标签/退款金额/申请时间/操作列
   - 订单号列点击打开详情抽屉
   - 操作列仅在 status===0（待审核）时显示审核按钮
   - 数据显示日期用后台返回的 createdAt（字符串），状态/类型用 typeText/typeTagType/statusText/statusTagType 方法映射
3. 审核弹窗：
   - 只读展示：售后单ID、订单号、会员、类型、原因、退款金额
   - 编辑：退款金额（预填当前值）、审核备注
   - 底部两个按钮：审核拒绝（danger，调用 rejectAfterSales）/审核通过（primary，调用 approveAfterSales）
   - 审核拒绝时只传 id 和 review_remark；审核通过时传 id、refund_amount 和 review_remark
4. 详情抽屉（el-drawer, size="520px"）：
   - el-descriptions 展示售后信息、订单信息、会员信息
   - el-table 展示 items JSON 中的商品列表（product_name/price/quantity/subtotal）
   - 通过表格订单号链接的点击打开（handleDetail）

```js
// 常量定义（在 export default 外部）
const QUERY_PARAM = { page: 1, pageSize: 10, status: '', type: '', order_id: '' }
const TYPE_MAP = { 1: '退货退款', 2: '换货', 3: '仅退款' }
const STATUS_MAP = { 0: '待审核', 1: '审核通过', 2: '已完成', 3: '已拒绝' }
const TYPE_TAG_MAP = { 1: 'primary', 2: 'warning', 3: 'success' }
const STATUS_TAG_MAP = { 0: 'warning', 1: 'success', 2: 'primary', 3: 'danger' }
const createDefaultReviewForm = () => ({ refund_amount: 0, review_remark: '' })
```

```js
// methods 方法清单
getList()             // 剔除空参数 → getAfterSalesList → tableData / total
handleCurrentChange() // 翻页
handleQuery()         // 查询重置 page=1
handleReset()         // 重置 queryParam
handleDetail(row)     // 设置 currentDetail，打开 drawer
handleReview(row)     // 设置审核表单数据（预填退款金额），打开审核弹窗
submitApprove()       // 调用 approveAfterSales，成功提示，关闭弹窗，刷新列表
submitReject()        // 调用 rejectAfterSales，成功提示，关闭弹窗，刷新列表
handleClose()         // 关闭审核弹窗，重置表单
typeText(val)         // 类型映射
typeTagType(val)
statusText(val)
statusTagType(val)
```

- [ ] **创建页面文件**

- [ ] **Commit**

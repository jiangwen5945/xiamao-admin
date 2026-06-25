# 售后管理模块（管理端）设计文档

## 概述

在瞎猫管理系统后台新增售后管理模块，用于查看和审核会员提交的售后申请。后端售后模块已就绪，前端完全新建。

## 功能范围

1. **售后单列表** — 分页展示所有售后单，支持按状态/类型/订单号筛选
2. **售后单详情** — 抽屉展示完整的售后单信息（含订单信息、会员信息、售后商品快照）
3. **审核操作** — 对待审核状态的售后单进行"审核通过"或"审核拒绝"
   - 审核通过：管理员可修改退款金额 + 填写审核备注
   - 审核拒绝：管理员填写审核备注

## 后端 API

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | `/after-sales/admin/list` | 售后单列表 | `page, pageSize, status, type, order_id` |
| POST | `/after-sales/admin/approve` | 审核通过 | `id, refund_amount, review_remark` |
| POST | `/after-sales/admin/reject` | 审核拒绝 | `id, review_remark` |

## 页面设计

### 路由

后端返回菜单树的 `component` 字段指向 `view/after-sales/after-sales-list`，动态路由自动注册。

### 筛选栏

- 状态筛选（el-select）：全部 / 待审核 / 审核通过 / 已完成 / 已拒绝
- 类型筛选（el-select）：全部 / 退货退款 / 换货 / 仅退款
- 订单号搜索（el-input）
- 查询/重置按钮

### 表格列

| 列 | 宽度 | 说明 |
|----|------|------|
| 售后单ID | 80 | |
| 订单号 | 180 | 可点击查看详情 |
| 会员 | 150 | 会员昵称/手机号 |
| 类型 | 90 | el-tag 颜色区分 |
| 状态 | 90 | el-tag 颜色区分 |
| 退款金额 | 110 | ￥前缀 |
| 申请时间 | 180 | |
| 操作 | 160 | 审核按钮（仅待审核状态显示） |

### 审核弹窗（el-dialog）

- 标题："审核售后单"
- 显示售后单基本信息（只读）：售后单ID、订单号、会员、类型、申请原因、退款金额
- 编辑字段：
  - 退款金额（el-input-number, 精度2）— 预填当前记录的退款金额，管理员可修改
  - 审核备注（el-textarea）
- 底部两个按钮：
  - "审核拒绝"（danger 类型）— 仅提交审核备注，不发送退款金额
  - "审核通过"（primary 类型）— 提交退款金额 + 审核备注

### 详情抽屉（el-drawer）

通过表格的"订单号"链接打开，显示：
- 售后信息：售后单ID、类型、状态、原因、退款金额、申请时间、审核时间、审核备注
- 订单信息：订单号、实付金额、订单状态
- 会员信息：会员昵称、手机号
- 售后商品列表：el-table 展示 items JSON 中的商品快照

### 状态/类型映射

```js
类型: { 1: { label: '退货退款', type: 'primary' }, 2: { label: '换货', type: 'warning' }, 3: { label: '仅退款', type: 'success' } }
状态: { 0: { label: '待审核', type: 'warning' }, 1: { label: '审核通过', type: 'success' }, 2: { label: '已完成', type: 'primary' }, 3: { label: '已拒绝', type: 'danger' } }
```

### 样式

遵循 `order-list.vue` 的模板样式：scoped SCSS、form-row 双列布局、table-header 操作栏。

## 文件清单

1. `src/api/index.js` — 追加 3 个 API 函数
2. `src/view/after-sales/after-sales-list.vue` — 完整页面组件

## 未包含范围

- 会员端售后申请页面（由会员端另行实现）
- 删除/编辑售后单（后端不支持）
- 库存自动变动（设计文档明确不涉及）

<template>
  <div class="page" v-loading="loading">

    <!-- 筛选栏 -->
    <FilterBar @query="handleQuery" @reset="handleReset">
      <FilterBarItem label="订单号">
        <el-input v-model="queryParam.order_no" placeholder="" clearable @keyup.enter="handleQuery" />
      </FilterBarItem>
      <FilterBarItem label="状态">
        <el-select v-model="queryParam.status" placeholder="全部" clearable>
          <el-option label="待付款" :value="0" />
          <el-option label="待发货" :value="1" />
          <el-option label="待收货" :value="2" />
          <el-option label="已完成" :value="3" />
          <el-option label="已取消" :value="4" />
        </el-select>
      </FilterBarItem>
      <FilterBarItem label="收货人">
        <el-input v-model="queryParam.consignee" placeholder="" clearable @keyup.enter="handleQuery" />
      </FilterBarItem>
    </FilterBar>

    <!-- 操作栏 -->
    <div class="table-header">
      <div class="left">
        <el-button type="primary" size="medium" @click="handleAdd">新增</el-button>
        <el-button type="danger" size="medium" :disabled="!selectedIds.length" @click="handleDelete(selectedIds)">删除选中</el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-content">
      <el-table :data="tableData" stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="45" />
        <el-table-column label="订单号" min-width="180">
          <template #default="scope">
            <el-link type="primary" :underline="false" @click="handleDetail(scope.row)">{{ scope.row.order_no }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="scope">
            <el-tag :type="statusTagType(scope.row.status)" size="mini">
              {{ statusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="商品总额" width="110">
          <template #default="scope">￥{{ scope.row.total_amount }}</template>
        </el-table-column>
        <el-table-column prop="actual_amount" label="实付金额" width="110">
          <template #default="scope">￥{{ scope.row.actual_amount }}</template>
        </el-table-column>
        <el-table-column prop="payment_method" label="支付方式" width="100" >
          <template #default="scope">
            <el-tag size="mini" v-if=" scope.row.payment_method">{{ scope.row.payment_method }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="consignee" label="收货人" width="90" />
        <el-table-column prop="consignee_phone" label="收货电话" width="120" />
        <el-table-column prop="shipping_address" label="收货地址" min-width="200">
          <template #default="scope">
            <el-tooltip :content="scope.row.shipping_address" placement="top">
              <span class="text-ellipsis">{{ scope.row.shipping_address }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="scope">
            <el-button size="mini" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" size="mini" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页 -->
      <el-pagination
        layout="total, prev, pager, next"
        :total="total"
        :page-size="queryParam.pageSize"
        :current-page.sync="queryParam.page"
        class="pagination"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      :title="modalType ? '修改订单' : '新增订单'"
      :visible="isVisible"
      :before-close="handleClose"
      center
      :destroy-on-close="true"
      width="720px"
    >
      <el-form ref="form" :model="form" :rules="formRules" label-width="100px" class="dialog-form">
        <div class="form-row">
          <el-form-item label="订单号" prop="order_no">
            <el-input v-model="form.order_no" placeholder="请输入订单号" :disabled="modalType === 1" />
          </el-form-item>
          <el-form-item label="会员ID" prop="member_id">
            <el-input-number v-model="form.member_id" :min="1" />
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="商品总额" prop="total_amount">
            <el-input-number v-model="form.total_amount" :precision="2" :min="0" />
          </el-form-item>
          <el-form-item label="实付金额" prop="actual_amount">
            <el-input-number v-model="form.actual_amount" :precision="2" :min="0" />
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="状态" prop="status">
            <el-select v-model="form.status" placeholder="请选择">
              <el-option label="待付款" :value="0" />
              <el-option label="待发货" :value="1" />
              <el-option label="待收货" :value="2" />
              <el-option label="已完成" :value="3" />
              <el-option label="已取消" :value="4" />
            </el-select>
          </el-form-item>
          <el-form-item label="支付方式">
            <el-select v-model="form.payment_method" placeholder="请选择支付方式">
              <el-option :label="item"  v-for="(item, index) in paymentMethodList" :key="index"/>
            </el-select>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="收货人" prop="consignee">
            <el-input v-model="form.consignee" placeholder="请输入收货人" />
          </el-form-item>
          <el-form-item label="收货电话" prop="consignee_phone">
            <el-input v-model="form.consignee_phone" placeholder="请输入收货电话" />
          </el-form-item>
        </div>
        <el-form-item label="收货地址" prop="shipping_address">
          <el-input v-model="form.shipping_address" type="textarea" :rows="2" placeholder="请输入收货地址" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleClose">取 消</el-button>
        <el-button type="primary" @click="submit">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      :visible.sync="detailVisible"
      title="订单详情"
      size="520px"
      :destroy-on-close="true"
    >
      <div class="drawer-body" v-if="currentDetail.id">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单号">{{ currentDetail.order_no }}</el-descriptions-item>
          <el-descriptions-item label="会员ID">{{ currentDetail.member_id }}</el-descriptions-item>
          <el-descriptions-item label="商品总额">￥{{ currentDetail.total_amount }}</el-descriptions-item>
          <el-descriptions-item label="实付金额">￥{{ currentDetail.actual_amount }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(currentDetail.status)" size="mini">
              {{ statusText(currentDetail.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ currentDetail.payment_method || '-' }}</el-descriptions-item>
          <el-descriptions-item label="支付时间">{{ currentDetail.payment_time || '-' }}</el-descriptions-item>
          <el-descriptions-item label="发货时间">{{ currentDetail.delivery_time || '-' }}</el-descriptions-item>
          <el-descriptions-item label="收货时间">{{ currentDetail.receive_time || '-' }}</el-descriptions-item>
          <el-descriptions-item label="收货人">{{ currentDetail.consignee }}</el-descriptions-item>
          <el-descriptions-item label="收货电话">{{ currentDetail.consignee_phone }}</el-descriptions-item>
          <el-descriptions-item label="收货地址">{{ currentDetail.shipping_address }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ currentDetail.remark || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentDetail.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ currentDetail.updatedAt }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import FilterBar from "../../components/FilterBar";
import FilterBarItem from "../../components/FilterBarItem";

const QUERY_PARAM = { page: 1, pageSize: 10, order_no: '', status: '', consignee: '' }
const createDefaultForm = () => ({
  id: '', order_no: '', member_id: '', total_amount: 0, actual_amount: 0,
  status: 0, payment_method: '', consignee: '', consignee_phone: '',
  shipping_address: '', remark: '',
})
const PAYMENT_METHOD_LIST = ['支付宝', '微信', '银联', '货到付款']

export default {
  name: "OrderList",
  components: { FilterBar, FilterBarItem },
  data() {
    return {
      loading: false,
      tableData: [],
      total: 0,
      isVisible: false,
      modalType: 0,
      form: createDefaultForm(),
      queryParam: { ...QUERY_PARAM },
      formRules: {
        order_no: [{ required: true, message: "订单号不能为空", trigger: "blur" }],
        member_id: [{ required: true, message: "会员ID不能为空", trigger: "blur" }],
        total_amount: [{ required: true, message: "商品总额不能为空", trigger: "blur" }],
        actual_amount: [{ required: true, message: "实付金额不能为空", trigger: "blur" }],
        consignee: [{ required: true, message: "收货人不能为空", trigger: "blur" }],
        consignee_phone: [{ required: true, message: "收货电话不能为空", trigger: "blur" }],
        shipping_address: [{ required: true, message: "收货地址不能为空", trigger: "blur" }],
      },
      selectedIds: [],
      detailVisible: false,
      currentDetail: {},
      paymentMethodList: PAYMENT_METHOD_LIST,
    };
  },

  async created() {
    this.getList();
  },
  activated() {
    this.getList();
  },
  methods: {
    async getList() {
      this.loading = true
      const params = { ...this.queryParam }
      Object.keys(params).forEach(k => {
        if (params[k] === '' || params[k] === null || params[k] === undefined) delete params[k]
        if (Array.isArray(params[k]) && !params[k].length) delete params[k]
      })
      try {
        const res = await this.$api.getOrderList(params);
        this.tableData = res.list;
        this.total = res.total;
      } finally {
        this.loading = false
      }
    },
    handleCurrentChange(currentPageNum) {
      this.queryParam.page = currentPageNum;
      this.getList();
    },
    handleQuery() {
      this.queryParam.page = 1;
      this.getList();
    },
    handleReset() {
      this.queryParam = { ...QUERY_PARAM }
      this.getList()
    },
    handleSelectionChange(rows) {
      this.selectedIds = rows.map(r => r.id)
    },
    handleDelete(ids) {
      if (!Array.isArray(ids)) ids = [ids.id]
      if (!ids.length) return
      this.$confirm(`确定删除选中的 ${ids.length} 个订单?`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.$api.deleteOrder({ ids }).then(() => {
            this.$message({ type: "success", message: "删除成功!" });
            this.selectedIds = [];
            this.getList();
          });
        })
        .catch((err) => {
          if (err === "cancel") return;
          this.$message({ type: "error", message: err });
        });
    },
    handleDetail(row) {
      this.currentDetail = row
      this.detailVisible = true
    },
    handleEdit(row) {
      this.isVisible = true;
      this.modalType = 1;
      this.form = JSON.parse(JSON.stringify(row));
      // 时间字段不在表单中展示
      delete this.form.createdAt
      delete this.form.updatedAt
      delete this.form.payment_time
      delete this.form.delivery_time
      delete this.form.receive_time
    },
    handleAdd() {
      this.form = createDefaultForm()
      this.isVisible = true;
      this.modalType = 0;
    },
    async submit() {
      await this.$refs.form.validate()
      const payload = { ...this.form }
      delete payload.createdAt
      delete payload.updatedAt
      delete payload.payment_time
      delete payload.delivery_time
      delete payload.receive_time
      if (this.modalType === 0) delete payload.id
      await (this.modalType === 0 ? this.$api.createOrder(payload) : this.$api.updateOrder(payload))
      this.getList()
      this.handleClose()
      this.$message({
        type: 'success',
        message: this.modalType === 0 ? '添加成功' : '编辑成功',
      })
    },
    handleClose() {
      this.form = createDefaultForm()
      this.isVisible = false;
      this.$refs.form.clearValidate();
    },
    statusText(status) {
      const map = { 0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消' }
      return map[status] || '未知'
    },
    statusTagType(status) {
      const map = { 0: 'warning', 1: 'primary', 2: '', 3: 'success', 4: 'danger' }
      return map[status] || 'info'
    },
  },
};
</script>

<style scoped lang="scss">
.drawer-body {
  padding: 0 20px 20px;
}
.dialog-form {
  padding: 10px 20px 0;
}
.dialog-form .form-row {
  display: flex;
  gap: 24px;
}
.dialog-form .form-row + .form-row {
  margin-top: 6px;
}
.dialog-form .form-row .el-form-item {
  flex: 1;
}
.dialog-form .form-row .el-form-item :deep(.el-input),
.dialog-form .form-row .el-form-item :deep(.el-select),
.dialog-form .form-row .el-form-item :deep(.el-input-number) {
  width: 100%;
}
.text-ellipsis {
  display: inline-block;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
</style>

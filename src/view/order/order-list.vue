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
          <el-option label="已退款" :value="5" />
          <el-option label="售后中" :value="6" />
        </el-select>
      </FilterBarItem>
      <FilterBarItem label="收货人">
        <el-input v-model="queryParam.consignee" placeholder="" clearable @keyup.enter="handleQuery" />
      </FilterBarItem>
      <FilterBarItem label="创建时间">
        <el-date-picker
          v-model="createDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd"
          @change="handleCreateDateChange"
        />
      </FilterBarItem>
      <FilterBarItem label="支付时间">
        <el-date-picker
          v-model="paymentDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd"
          @change="handlePaymentDateChange"
        />
      </FilterBarItem>
    </FilterBar>

    <!-- 操作栏 -->
    <div class="table-header">
      <div class="left">
        <el-button type="primary" size="medium" @click="handleAdd">新增订单</el-button>
        <CommonExcel :tableData="tableData" :columns="exportColumns" filename="订单列表" />
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-content">
      <el-table :data="tableData" stripe ref="refTable">
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
        <el-table-column prop="payment_method" label="支付方式" width="100">
          <template #default="scope">
            <el-tag size="mini" v-if=" scope.row.payment_method">{{ scope.row.payment_method }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="支付时间" width="170">
          <template #default="scope">
            {{ scope.row.payment_time | dateTime }}
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
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="scope">
            {{ scope.row.createdAt | dateTime }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="scope">
            <el-button
              v-if="scope.row.status === 0"
              type="primary"
              size="mini"
              @click="handlePay(scope.row)"
            >支付</el-button>
            <el-button
              v-if="scope.row.status === 0"
              size="mini"
              @click="handleCancel(scope.row)"
            >取消</el-button>
            <el-button
              v-if="scope.row.status === 1"
              type="primary"
              size="mini"
              @click="handleGoDelivery(scope.row)"
            >去发货</el-button>
            <el-button
              v-if="scope.row.status === 2"
              type="success"
              size="mini"
              @click="handleConfirm(scope.row)"
            >确认收货</el-button>
            <el-button
              v-if="scope.row.status === 3"
              type="warning"
              size="mini"
              @click="handleAfterSales(scope.row)"
            >售后</el-button>
            <span v-if="![0, 1, 2, 3].includes(scope.row.status)" class="no-action">-</span>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        layout="total, prev, pager, next"
        :total="total"
        :page-size="queryParam.pageSize"
        :current-page.sync="queryParam.page"
        class="pagination"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增订单弹窗 -->
    <el-dialog
      title="新增订单"
      :visible="addVisible"
      :before-close="handleAddClose"
      center
      :destroy-on-close="true"
      width="800px"
    >
      <el-form ref="addForm" :model="addForm" :rules="addFormRules" label-width="100px">
        <div class="form-row">
          <el-form-item label="会员ID" prop="member_id">
            <el-input-number v-model="addForm.member_id" :min="1" />
          </el-form-item>
          <el-form-item label="收货人" prop="consignee">
            <el-input v-model="addForm.consignee" placeholder="请输入收货人" />
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="收货电话" prop="consignee_phone">
            <el-input v-model="addForm.consignee_phone" placeholder="请输入收货电话" />
          </el-form-item>
          <el-form-item label="收货地址" prop="shipping_address">
            <el-input v-model="addForm.shipping_address" placeholder="请输入收货地址" />
          </el-form-item>
        </div>
        <el-form-item label="备注">
          <el-input v-model="addForm.remark" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>

        <el-form-item label="商品明细" required>
          <div class="order-items">
            <div class="order-item" v-for="(item, index) in addForm.items" :key="index">
              <el-select
                v-model="item.product_id"
                filterable
                placeholder="搜索选择商品"
                style="width:240px"
                @change="val => handleProductChange(val, index)"
              >
                <el-option
                  v-for="p in productList"
                  :key="p.id"
                  :label="`${p.name} (￥${p.price})`"
                  :value="p.id"
                />
              </el-select>
              <el-input-number v-model="item.quantity" :min="1" :max="999" style="width:120px" />
              <span class="item-subtotal">￥{{ calcSubtotal(index) }}</span>
              <el-button type="danger" size="mini" icon="el-icon-delete" circle @click="removeItem(index)" />
            </div>
            <el-button type="primary" size="mini" icon="el-icon-plus" @click="addItem">添加商品</el-button>
          </div>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleAddClose">取 消</el-button>
        <el-button type="primary" :loading="addLoading" @click="submitAdd">确 定</el-button>
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
        </el-descriptions>

        <div class="drawer-section-title">商品明细</div>
        <el-table :data="currentDetail.OrderItems || []" size="small" stripe>
          <el-table-column label="商品" min-width="180">
            <template #default="scope">
              <div class="product-cell">
                <img v-if="scope.row.product_image" :src="scope.row.product_image" class="product-img" />
                <span>{{ scope.row.product_name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="单价" width="100">
            <template #default="scope">￥{{ scope.row.price }}</template>
          </el-table-column>
          <el-table-column label="数量" width="80">
            <template #default="scope">{{ scope.row.quantity }}</template>
          </el-table-column>
          <el-table-column label="小计" width="100">
            <template #default="scope">￥{{ scope.row.subtotal }}</template>
          </el-table-column>
        </el-table>

        <el-descriptions :column="1" border class="drawer-descriptions">
          <el-descriptions-item label="备注">{{ currentDetail.remark || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentDetail.createdAt | dateTime }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ currentDetail.updatedAt | dateTime }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>

    <!-- 发起售后弹窗 -->
    <el-dialog
      title="发起售后"
      :visible="afterSalesVisible"
      :before-close="handleAfterSalesClose"
      center
      :destroy-on-close="true"
      width="500px"
    >
      <el-form ref="afterSalesForm" :model="afterSalesForm" label-width="100px">
        <el-form-item label="售后类型" required>
          <el-radio-group v-model="afterSalesForm.type">
            <el-radio :label="1">退货退款</el-radio>
            <el-radio :label="3">仅退款</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="退款金额" prop="refund_amount">
          <el-input-number v-model="afterSalesForm.refund_amount" :precision="2" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="售后原因">
          <el-input v-model="afterSalesForm.reason" type="textarea" :rows="3" placeholder="请填写售后原因" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleAfterSalesClose">取 消</el-button>
        <el-button type="primary" @click="submitAfterSales" :loading="afterSalesLoading">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import FilterBar from "@/components/filter/FilterBar";
import FilterBarItem from "@/components/filter/FilterBarItem";
import CommonExcel from "@/components/CommonExcel";
import dayjs from 'dayjs'
import { cleanParams } from "@/utils/helpers";

const QUERY_PARAM = { page: 1, pageSize: 10, order_no: '', status: '', consignee: '', created_at_from: '', created_at_to: '', payment_time_from: '', payment_time_to: '' }
const createDefaultAddForm = () => ({
  member_id: 1,
  consignee: '',
  consignee_phone: '',
  shipping_address: '',
  remark: '',
  items: [{ product_id: '', quantity: 1 }],
})

export default {
  name: "OrderList",
  components: { FilterBar, FilterBarItem, CommonExcel },
  filters: {
    dateTime(val) {
      return val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
  },
  data() {
    return {
      loading: false,
      tableData: [],
      total: 0,
      queryParam: { ...QUERY_PARAM },
      addVisible: false,
      addLoading: false,
      addForm: createDefaultAddForm(),
      addFormRules: {
        member_id: [{ required: true, message: '会员ID不能为空', trigger: 'blur' }],
        consignee: [{ required: true, message: '收货人不能为空', trigger: 'blur' }],
        consignee_phone: [{ required: true, message: '收货电话不能为空', trigger: 'blur' }],
        shipping_address: [{ required: true, message: '收货地址不能为空', trigger: 'blur' }],
      },
      productList: [],
      productMap: {},
      detailVisible: false,
      currentDetail: {},
      afterSalesVisible: false,
      afterSalesForm: { type: 1, reason: '', refund_amount: 0 },
      afterSalesOrderId: null,
      afterSalesLoading: false,
      createDateRange: null,
      paymentDateRange: null,
    };
  },
  computed: {
    exportColumns() {
      return [
        { label: '订单号', prop: 'order_no' },
        { label: '状态', formatter: (row) => this.statusText(row.status) },
        { label: '商品总额', formatter: (row) => `¥${row.total_amount}` },
        { label: '实付金额', formatter: (row) => `¥${row.actual_amount}` },
        { label: '支付方式', formatter: (row) => row.payment_method || '-' },
        { label: '支付时间', formatter: (row) => row.payment_time ? dayjs(row.payment_time).format('YYYY-MM-DD HH:mm:ss') : '-' },
        { label: '收货人', prop: 'consignee' },
        { label: '收货电话', prop: 'consignee_phone' },
        { label: '收货地址', prop: 'shipping_address' },
        { label: '创建时间', formatter: (row) => row.createdAt ? dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-' },
      ]
    },
  },
  async created() {
    this.getList();
    this.loadProducts();
  },
  activated() {
    this.getList();
  },
  methods: {
    async getList() {
      this.loading = true
      const params = cleanParams(this.queryParam)
      try {
        const res = await this.$api.getAdminOrderList(params);
        this.tableData = res.list;
        this.total = res.total;
      } finally {
        this.loading = false
      }
    },
    async loadProducts() {
      try {
        const res = await this.$api.getProductList({ pageSize: 999 })
        this.productList = res.list || res
        const map = {}
        ;(this.productList).forEach(p => { map[p.id] = p })
        this.productMap = map
      } catch {
        this.productList = []
        this.productMap = {}
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
      this.createDateRange = null
      this.paymentDateRange = null
      this.getList()
    },
    handleCreateDateChange(val) {
      if (val) {
        this.queryParam.created_at_from = val[0]
        this.queryParam.created_at_to = val[1]
      } else {
        this.queryParam.created_at_from = ''
        this.queryParam.created_at_to = ''
      }
    },
    handlePaymentDateChange(val) {
      if (val) {
        this.queryParam.payment_time_from = val[0]
        this.queryParam.payment_time_to = val[1]
      } else {
        this.queryParam.payment_time_from = ''
        this.queryParam.payment_time_to = ''
      }
    },
    handleDetail(row) {
      this.currentDetail = row
      this.detailVisible = true
    },
    handlePay(row) {
      this.$confirm('确认将该订单标记为已支付?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info',
      }).then(() => {
        this.$api.payOrder({ id: row.id }).then(() => {
          this.$message({ type: 'success', message: '支付成功' })
          this.getList()
        })
      }).catch(err => {
        if (err === 'cancel') return
        this.$message({ type: 'error', message: err })
      })
    },
    handleCancel(row) {
      this.$confirm('确定取消该订单?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => {
        this.$api.cancelOrder({ id: row.id }).then(() => {
          this.$message({ type: 'success', message: '取消成功' })
          this.getList()
        })
      }).catch(err => {
        if (err === 'cancel') return
        this.$message({ type: 'error', message: err })
      })
    },
    handleConfirm(row) {
      this.$confirm('确认该订单已收货?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info',
      }).then(() => {
        this.$api.confirmOrder({ id: row.id }).then(() => {
          this.$message({ type: 'success', message: '确认收货成功' })
          this.getList()
        })
      }).catch(err => {
        if (err === 'cancel') return
        this.$message({ type: 'error', message: err })
      })
    },
    // 新增订单
    handleAdd() {
      this.addForm = createDefaultAddForm()
      this.addVisible = true
    },
    handleAddClose() {
      this.addForm = createDefaultAddForm()
      this.$refs.addForm?.clearValidate()
      this.addVisible = false
    },
    addItem() {
      this.addForm.items.push({ product_id: '', quantity: 1 })
    },
    removeItem(index) {
      this.addForm.items.splice(index, 1)
    },
    handleProductChange(productId, index) {
      const product = this.productMap[productId]
      if (product) {
        this.$set(this.addForm.items, index, { ...this.addForm.items[index], product_id: productId, product_name: product.name, price: product.price })
      }
    },
    calcSubtotal(index) {
      const item = this.addForm.items[index]
      if (!item.product_id || !item.quantity) return '0.00'
      const product = this.productMap[item.product_id]
      return product ? (product.price * item.quantity).toFixed(2) : '0.00'
    },
    async submitAdd() {
      await this.$refs.addForm.validate()
      if (!this.addForm.items.length || !this.addForm.items.every(i => i.product_id)) {
        this.$message({ type: 'warning', message: '请添加商品' })
        return
      }
      this.addLoading = true
      try {
        const res = await this.$api.createOrder({
          member_id: this.addForm.member_id,
          consignee: this.addForm.consignee,
          consignee_phone: this.addForm.consignee_phone,
          shipping_address: this.addForm.shipping_address,
          remark: this.addForm.remark || undefined,
          items: this.addForm.items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        })
        if (res) {
          this.$message({ type: 'success', message: '订单创建成功' })
          this.handleAddClose()
          this.getList()
        }
      } catch (e) {
        this.$message({ type: 'error', message: e || '创建失败' })
      } finally {
        this.addLoading = false
      }
    },
    // 售后
    handleAfterSales(row) {
      this.afterSalesOrderId = row.id
      this.afterSalesForm = { type: 1, reason: '', refund_amount: Number(row.actual_amount) || 0 }
      this.afterSalesVisible = true
    },
    // 去发货
    handleGoDelivery(row) {
      this.$router.push({ path: '/logistics/delivery', query: { order_no: row.order_no } })
    },
    async submitAfterSales() {
      this.afterSalesLoading = true
      try {
        await this.$api.adminApplyAfterSales({
          order_id: this.afterSalesOrderId,
          type: this.afterSalesForm.type,
          reason: this.afterSalesForm.reason || undefined,
          refund_amount: this.afterSalesForm.refund_amount,
        })
        this.$message({ type: 'success', message: '售后单创建成功' })
        this.afterSalesVisible = false
        this.getList()
      } finally {
        this.afterSalesLoading = false
      }
    },
    handleAfterSalesClose() {
      this.afterSalesVisible = false
    },
    statusText(status) {
      const map = { 0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消', 5: '已退款', 6: '售后中' }
      return map[status] || '未知'
    },
    statusTagType(status) {
      const map = { 0: 'warning', 1: 'primary', 2: '', 3: 'success', 4: 'danger', 5: 'danger', 6: 'warning' }
      return map[status] || 'info'
    },
  },
};
</script>

<style scoped lang="scss">
.drawer-body {
  padding: 0 20px 20px;
}
.drawer-section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 20px 0 10px;
  padding-left: 4px;
  border-left: 3px solid #409eff;
}
.drawer-descriptions {
  margin-top: 20px;
}
.product-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.product-img {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}
.dialog-form {
  padding: 10px 20px 0;
}
.form-row {
  display: flex;
  gap: 24px;
}
.form-row + .form-row {
  margin-top: 6px;
}
.form-row .el-form-item {
  flex: 1;
}
.form-row .el-form-item :deep(.el-input),
.form-row .el-form-item :deep(.el-select),
.form-row .el-form-item :deep(.el-input-number) {
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
.no-action {
  color: #c0c4cc;
}
.order-items {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
}
.order-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.order-item:last-child {
  margin-bottom: 0;
}
.item-subtotal {
  min-width: 80px;
  color: #409eff;
  font-weight: 600;
}
</style>

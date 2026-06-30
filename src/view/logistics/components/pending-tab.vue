<template>
  <div v-loading="loading">
    <div class="table-content">
      <el-table :data="tableData" stripe>
        <el-table-column label="订单号">
          <template #default="scope">
            <el-link type="primary" :underline="false" @click="handleDetail(scope.row)">{{ scope.row.order_no }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="收货人">
          <template #default="scope">{{ scope.row.consignee }}</template>
        </el-table-column>
        <el-table-column label="收货电话">
          <template #default="scope">{{ scope.row.consignee_phone }}</template>
        </el-table-column>
        <el-table-column label="创建时间">
          <template #default="scope">{{ scope.row.created_at | dateTime }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="mini" @click="handleShip(scope.row)">发货</el-button>
            <el-button size="mini" @click="handleVirtualShip(scope.row)">虚拟发货</el-button>
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

    <!-- 详情抽屉 -->
    <el-drawer
      :visible.sync="detailVisible"
      title="订单详情"
      size="520px"
      :destroy-on-close="true"
    >
      <div class="drawer-body" v-if="currentDetail.order_id">
        <div class="drawer-section-title">订单信息</div>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单号">{{ currentDetail.order_no }}</el-descriptions-item>
          <el-descriptions-item label="收货人">{{ currentDetail.consignee }}</el-descriptions-item>
          <el-descriptions-item label="收货电话">{{ currentDetail.consignee_phone }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentDetail.created_at | dateTime }}</el-descriptions-item>
        </el-descriptions>

        <div class="drawer-section-title">商品明细</div>
        <el-table :data="currentDetail.items || []" size="small" stripe>
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
            <template #default="scope">￥{{ (scope.row.price * scope.row.quantity).toFixed(2) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>

    <!-- 发货对话框 -->
    <el-dialog title="发货" :visible.sync="shipVisible" width="420px" :destroy-on-close="true" @closed="handleShipClose">
      <el-form ref="shipForm" :model="shipForm" :rules="shipRules" label-width="80px">
        <el-form-item label="物流公司" prop="express_company_id">
          <el-select v-model="shipForm.express_company_id" placeholder="请选择" style="width:100%">
            <el-option v-for="item in expressCompanyList" :key="item.id" :label="item.item_name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="运单号" prop="express_no">
          <el-input v-model="shipForm.express_no" placeholder="请输入" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipVisible = false">取消</el-button>
        <el-button type="primary" :loading="shipLoading" @click="handleShipSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import dayjs from "dayjs"
import { cleanParams } from "@/utils/helpers"

const QUERY_PARAM = { page: 1, pageSize: 10, order_no: '' }
const createShipForm = () => ({ express_company_id: '', express_no: '' })

export default {
  name: "PendingTab",
  props: {
    expressCompanyList: { type: Array, default: () => [] },
    filterParams: { type: Object, default: () => ({}) },
  },
  filters: {
    dateTime(val) {
      return val ? dayjs(val).format("YYYY-MM-DD HH:mm") : '-'
    }
  },
  data() {
    return {
      loading: false,
      tableData: [],
      total: 0,
      queryParam: { ...QUERY_PARAM },
      detailVisible: false,
      currentDetail: {},
      shipVisible: false,
      shipLoading: false,
      shipForm: createShipForm(),
      shipRules: {
        express_company_id: [{ required: true, message: '请选择物流公司', trigger: 'change' }],
        express_no: [{ required: true, message: '请输入运单号', trigger: 'blur' }]
      },
      currentOrderId: null,
    }
  },
  created() {
    this.getList()
  },
  methods: {
    async getList() {
      this.loading = true
      const params = {
        page: this.queryParam.page,
        pageSize: this.queryParam.pageSize,
        order_no: this.filterParams.order_no || this.queryParam.order_no || '',
      }
      cleanParams(params)
      try {
        const res = await this.$api.getLogisticsPending(params)
        this.tableData = res.list
        this.total = res.total
      } finally {
        this.loading = false
      }
    },
    handleFilterQuery() {
      this.queryParam.page = 1
      this.getList()
    },
    handleFilterReset() {
      this.queryParam = { ...QUERY_PARAM }
      this.getList()
    },
    handleCurrentChange(page) {
      this.queryParam.page = page
      this.getList()
    },
    handleDetail(row) {
      this.currentDetail = row
      this.detailVisible = true
    },
    handleShip(row) {
      this.currentOrderId = row.order_id
      this.shipForm = createShipForm()
      this.shipVisible = true
    },
    async handleShipSubmit() {
      const valid = await this.$refs.shipForm.validate().catch(() => false)
      if (!valid) return
      this.shipLoading = true
      try {
        await this.$api.shipOrder({ order_id: this.currentOrderId, ...this.shipForm })
        this.$message({ type: 'success', message: '发货成功' })
        this.shipVisible = false
        this.getList()
      } catch (e) {
        this.$message({ type: 'error', message: e || '发货失败' })
      } finally {
        this.shipLoading = false
      }
    },
    handleShipClose() {
      this.currentOrderId = null
      this.shipForm = createShipForm()
      this.$refs.shipForm?.clearValidate()
    },
    handleVirtualShip(row) {
      this.$confirm('虚拟商品无需物流配送，确认后直接标记为已完成?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info',
      }).then(() => {
        this.$api.virtualShip({ order_id: row.order_id }).then(() => {
          this.$message({ type: 'success', message: '虚拟发货成功' })
          this.getList()
        })
      }).catch(err => {
        if (err === 'cancel') return
        this.$message({ type: 'error', message: err })
      })
    }
  }
}
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
</style>

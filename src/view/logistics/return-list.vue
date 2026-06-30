<template>
  <div class="page" v-loading="loading">
    <FilterBar @query="handleQuery" @reset="handleReset">
      <FilterBarItem label="订单号">
        <el-input v-model="queryParam.order_no" clearable @keyup.enter="handleQuery" />
      </FilterBarItem>
      <FilterBarItem label="运单号">
        <el-input v-model="queryParam.return_express_no" clearable @keyup.enter="handleQuery" />
      </FilterBarItem>
      <FilterBarItem label="售后单ID">
        <el-input v-model="queryParam.after_sales_id" clearable @keyup.enter="handleQuery" />
      </FilterBarItem>
      <FilterBarItem label="退货时间">
        <el-date-picker
          v-model="returnRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd"
          @change="handleReturnRangeChange"
        />
      </FilterBarItem>
    </FilterBar>

    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane label="待退货" name="0" />
      <el-tab-pane label="退货中" name="1" />
      <el-tab-pane label="已签收" name="2" />
      <el-tab-pane label="已入库" name="3" />
    </el-tabs>

    <div class="table-content">
      <el-table :data="tableData" stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column label="订单号" min-width="160">
          <template #default="scope">
            <el-link type="primary" :underline="false" @click="handleDetail(scope.row)">
              {{ scope.row.Order?.order_no || '-' }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="售后单ID" width="90">
          <template #default="scope">
            <el-tag size="mini">{{ scope.row.after_sales_id || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="退货状态" width="90">
          <template #default="scope">
            <el-tag :type="statusTagType(scope.row.status)" size="mini">
              {{ statusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="物流公司" width="120">
          <template #default="scope">
            {{ scope.row.expressCompany?.item_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="退货运单号" width="150">
          <template #default="scope">
            {{ scope.row.return_express_no || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="退货原因" min-width="140">
          <template #default="scope">
            <el-tooltip :content="scope.row.return_reason || '-'" placement="top">
              <span class="text-ellipsis">{{ scope.row.return_reason || '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="收货人" width="80">
          <template #default="scope">{{ scope.row.Order?.consignee || '-' }}</template>
        </el-table-column>
        <el-table-column label="实付金额" width="90">
          <template #default="scope">￥{{ scope.row.Order?.actual_amount || '0.00' }}</template>
        </el-table-column>
        <el-table-column label="退货时间" width="160">
          <template #default="scope">{{ scope.row.returned_at | dateTime }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="scope">
            <el-button
              v-if="scope.row.status < 2"
              type="text"
              size="mini"
              @click="handleEdit(scope.row)"
            >{{ scope.row.status === 0 ? '填写物流' : '编辑' }}</el-button>
            <el-button
              v-if="scope.row.status === 1"
              type="text"
              size="mini"
              @click="handleSign(scope.row)"
            >签收</el-button>
            <el-button
              v-if="scope.row.status === 2"
              type="text"
              size="mini"
              @click="handleWarehousing(scope.row)"
            >入库</el-button>
            <el-button
              v-if="scope.row.status < 2"
              type="text"
              size="mini"
              style="color: #f56c6c"
              @click="handleDelete(scope.row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        :page-size="queryParam.pageSize"
        :current-page.sync="queryParam.page"
        class="pagination"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog
      :visible.sync="isVisible"
      :title="dialogTitle"
      width="560px"
      :destroy-on-close="true"
      @close="handleClose"
    >
      <el-form ref="form" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="物流公司" prop="express_company_id">
          <el-select v-model="form.express_company_id" placeholder="请选择" clearable style="width: 100%">
            <el-option v-for="item in expressCompanyList" :key="item.id"
              :label="item.item_name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="退货运单号" prop="return_express_no">
          <el-input v-model="form.return_express_no" placeholder="请输入退货运单号" />
        </el-form-item>
        <el-form-item label="退货原因">
          <el-input v-model="form.return_reason" type="textarea" :rows="3" placeholder="请输入退货原因" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      :visible.sync="detailVisible"
      title="退货详情"
      size="520px"
      :destroy-on-close="true"
    >
      <div class="drawer-body" v-if="currentDetail.id">
        <div class="drawer-section-title">退货物流信息</div>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="退货状态">
            <el-tag :type="statusTagType(currentDetail.status)" size="mini">
              {{ statusText(currentDetail.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="物流公司">{{ currentDetail.expressCompany?.item_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="退货运单号">{{ currentDetail.return_express_no || '-' }}</el-descriptions-item>
          <el-descriptions-item label="退货原因">{{ currentDetail.return_reason || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ currentDetail.remark || '-' }}</el-descriptions-item>
          <el-descriptions-item label="退货时间">{{ currentDetail.returned_at | dateTime }}</el-descriptions-item>
          <el-descriptions-item label="签收时间">{{ currentDetail.signed_at | dateTime }}</el-descriptions-item>
          <el-descriptions-item label="入库时间">{{ currentDetail.warehoused_at | dateTime }}</el-descriptions-item>
        </el-descriptions>

        <div class="drawer-section-title">订单信息</div>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单号">{{ currentDetail.Order?.order_no || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="orderStatusTagType(currentDetail.Order?.status)" size="mini">
              {{ orderStatusText(currentDetail.Order?.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="实付金额">￥{{ currentDetail.Order?.actual_amount || '0.00' }}</el-descriptions-item>
          <el-descriptions-item label="收货人">{{ currentDetail.Order?.consignee || '-' }}</el-descriptions-item>
          <el-descriptions-item label="收货电话">{{ currentDetail.Order?.consignee_phone || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="drawer-section-title">商品明细</div>
        <el-table :data="currentDetail.Order?.OrderItems || []" size="small" stripe>
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
  </div>
</template>

<script>
import FilterBar from "@/components/filter/FilterBar"
import FilterBarItem from "@/components/filter/FilterBarItem"
import dayjs from 'dayjs'
import { cleanParams } from "@/utils/helpers"

const QUERY_PARAM = {
  page: 1,
  pageSize: 10,
  order_no: '',
  return_express_no: '',
  after_sales_id: '',
  returned_at_from: '',
  returned_at_to: '',
}

const TAB_STATUS_MAP = { '0': '0', '1': '1', '2': '2', '3': '3' }

const createDefaultForm = () => ({
  id: '',
  express_company_id: '',
  return_express_no: '',
  return_reason: '',
  remark: '',
})

export default {
  name: "ReturnList",
  components: { FilterBar, FilterBarItem },
  filters: {
    dateTime(val) {
      return val ? dayjs(val).format("YYYY-MM-DD HH:mm") : '-'
    },
  },
  data() {
    return {
      loading: false,
      tableData: [],
      total: 0,
      activeTab: '0',
      queryParam: { ...QUERY_PARAM },
      returnRange: null,
      selectedIds: [],
      isVisible: false,
      form: createDefaultForm(),
      formRules: {
        order_id: [{ required: true, message: '请选择关联订单', trigger: 'change' }],
      },
      submitLoading: false,
      dialogTitle: '编辑退货',
      detailVisible: false,
      currentDetail: {},
      expressCompanyList: [],
    }
  },
  created() {
    this.loadExpressCompany()
    // 从售后列表跳转过来时，接收 after_sales_id 参数
    const afterSalesId = this.$route.query.after_sales_id
    if (afterSalesId) {
      this.queryParam.after_sales_id = afterSalesId
    }
    this.getList()
  },
  activated() {
    this.getList()
  },
  methods: {
    async getList() {
      this.loading = true
      const params = cleanParams(this.queryParam)
      try {
        const res = await this.$api.getReturnList(params)
        this.tableData = res.list
        this.total = res.total
      } catch (e) {
        this.$message.error(e || '获取列表失败')
      } finally {
        this.loading = false
      }
    },
    async loadExpressCompany() {
      try {
        const res = await this.$api.getDictList('express_company')
        this.expressCompanyList = res
      } catch {
        this.expressCompanyList = []
      }
    },
    handleTabClick() {
      this.queryParam.status = TAB_STATUS_MAP[this.activeTab]
      this.queryParam.page = 1
      this.getList()
    },
    handleCurrentChange(page) {
      this.queryParam.page = page
      this.getList()
    },
    handleSizeChange(size) {
      this.queryParam.pageSize = size
      this.queryParam.page = 1
      this.getList()
    },
    handleQuery() {
      this.queryParam.page = 1
      this.getList()
    },
    handleReset() {
      this.queryParam = { ...QUERY_PARAM }
      this.returnRange = null
      this.activeTab = this.$route.query.after_sales_id ? '0' : '0'
      const afterSalesId = this.$route.query.after_sales_id
      if (afterSalesId) {
        this.queryParam.after_sales_id = afterSalesId
      }
      this.getList()
    },
    handleSelectionChange(rows) {
      this.selectedIds = rows.map(r => r.id)
    },
    handleReturnRangeChange(val) {
      if (val) {
        this.queryParam.returned_at_from = val[0]
        this.queryParam.returned_at_to = val[1]
      } else {
        this.queryParam.returned_at_from = ''
        this.queryParam.returned_at_to = ''
      }
    },
    handleEdit(row) {
      this.form = {
        id: row.id,
        express_company_id: row.express_company_id,
        return_express_no: row.return_express_no,
        return_reason: row.return_reason,
        remark: row.remark,
      }
      this.dialogTitle = row.status === 0 ? '填写物流信息' : '编辑退货'
      this.isVisible = true
    },
    handleDetail(row) {
      this.currentDetail = row
      this.detailVisible = true
    },
    async handleSign(row) {
      await this.$confirm('确认签收该退货单?', '提示', {
        confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
      })
      try {
        await this.$api.signReturn({ id: row.id })
        this.$message.success('签收成功')
        this.getList()
      } catch (e) {
        this.$message.error(e || '签收失败')
      }
    },
    async handleWarehousing(row) {
      await this.$confirm('确认该退货商品已入库?', '提示', {
        confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
      })
      try {
        await this.$api.warehousingReturn({ id: row.id })
        this.$message.success('入库成功')
        this.getList()
      } catch (e) {
        this.$message.error(e || '入库失败')
      }
    },
    async handleDelete(row) {
      await this.$confirm('确定删除该退货记录?', '提示', {
        confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
      })
      try {
        await this.$api.deleteReturn({ id: row.id })
        this.$message.success('删除成功')
        this.getList()
      } catch (e) {
        this.$message.error(e || '删除失败')
      }
    },
    async submit() {
      const valid = await this.$refs.form.validate().catch(() => {})
      if (!valid) return
      this.submitLoading = true
      try {
        await this.$api.updateReturn(this.form)
        this.$message.success('更新成功')
        this.isVisible = false
        this.getList()
      } catch (e) {
        this.$message.error(e || '操作失败')
      } finally {
        this.submitLoading = false
      }
    },
    handleClose() {
      this.isVisible = false
      this.$refs.form?.resetFields()
    },
    statusText(val) {
      const map = { 0: '待退货', 1: '退货中', 2: '已签收', 3: '已入库' }
      return map[val] || '未知'
    },
    statusTagType(val) {
      const map = { 0: 'warning', 1: 'primary', 2: 'success', 3: 'success' }
      return map[val] || 'info'
    },
    orderStatusText(val) {
      const map = { 0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消', 5: '已退款', 6: '售后中' }
      return map[val] || '未知'
    },
    orderStatusTagType(val) {
      const map = { 0: 'warning', 1: 'primary', 2: '', 3: 'success', 4: 'danger' }
      return map[val] || 'info'
    },
  },
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
.text-ellipsis {
  display: inline-block;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
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

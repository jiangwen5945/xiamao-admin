<template>
  <div v-loading="loading">
    <FilterBar @query="handleQuery" @reset="handleReset">
      <FilterBarItem label="订单号">
        <el-input v-model="queryParam.order_no" clearable @keyup.enter="handleQuery" />
      </FilterBarItem>
      <FilterBarItem label="物流公司">
        <el-select v-model="queryParam.express_company_id" placeholder="全部" clearable>
          <el-option
            v-for="item in expressCompanyList"
            :key="item.id"
            :label="item.item_name"
            :value="item.id"
          />
        </el-select>
      </FilterBarItem>
      <FilterBarItem label="运单号">
        <el-input v-model="queryParam.express_no" clearable @keyup.enter="handleQuery" />
      </FilterBarItem>
      <FilterBarItem label="发货时间">
        <el-date-picker
          v-model="deliveryRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd"
          @change="handleDeliveryRangeChange"
        />
      </FilterBarItem>
    </FilterBar>

    <div class="table-content">
      <el-table :data="tableData" stripe>
        <el-table-column label="订单号" min-width="180">
          <template #default="scope">
            <el-link type="primary" :underline="false" @click="handleDetail(scope.row)">
              {{ scope.row.Order?.order_no || '-' }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="物流状态" width="90">
          <template #default="scope">
            <el-tag :type="shipStatusTagType(scope.row.status)" size="mini">
              {{ shipStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="收货人" width="90">
          <template #default="scope">{{ scope.row.Order?.consignee || '-' }}</template>
        </el-table-column>
        <el-table-column label="收货电话" width="120">
          <template #default="scope">{{ scope.row.Order?.consignee_phone || '-' }}</template>
        </el-table-column>
        <el-table-column label="收货地址" min-width="200">
          <template #default="scope">
            <el-tooltip :content="scope.row.Order?.shipping_address" placement="top">
              <span class="text-ellipsis">{{ scope.row.Order?.shipping_address }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="物流公司" width="120">
          <template #default="scope">
            <span>{{ scope.row.expressCompany?.item_name || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="运单号" width="150">
          <template #default="scope">
            <span>{{ scope.row.express_no || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="发货时间" width="180">
          <template #default="scope">{{ scope.row.shipped_at | dateTime }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button
              v-if="listStatus === 0"
              type="primary"
              size="mini"
              @click="handleSign(scope.row)"
            >签收</el-button>
            <span v-else class="no-action">-</span>
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

    <el-drawer
      :visible.sync="detailVisible"
      title="物流详情"
      size="520px"
      :destroy-on-close="true"
    >
      <div class="drawer-body" v-if="currentDetail.id">
        <div class="drawer-section-title">物流信息</div>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="物流状态">
            <el-tag :type="shipStatusTagType(currentDetail.status)" size="mini">
              {{ shipStatusText(currentDetail.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="物流公司">{{ currentDetail.expressCompany?.item_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="运单号">{{ currentDetail.express_no || '-' }}</el-descriptions-item>
          <el-descriptions-item label="发货时间">{{ currentDetail.shipped_at | dateTime }}</el-descriptions-item>
          <el-descriptions-item label="签收时间">{{ currentDetail.signed_at | dateTime }}</el-descriptions-item>
        </el-descriptions>
        <div class="drawer-section-title">订单信息</div>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单号">{{ currentDetail.Order?.order_no || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="orderStatusTagType(currentDetail.Order?.status)" size="mini">
              {{ orderStatusText(currentDetail.Order?.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="收货人">{{ currentDetail.Order?.consignee || '-' }}</el-descriptions-item>
          <el-descriptions-item label="收货电话">{{ currentDetail.Order?.consignee_phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="收货地址">{{ currentDetail.Order?.shipping_address || '-' }}</el-descriptions-item>
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

const QUERY_PARAM = {
  page: 1,
  pageSize: 10,
  order_no: '',
  express_company_id: '',
  express_no: '',
  shipped_at_from: '',
  shipped_at_to: '',
}

export default {
  name: "ShippedTab",
  components: { FilterBar, FilterBarItem },
  props: {
    expressCompanyList: { type: Array, default: () => [] },
    listStatus: { type: Number, required: true }
  },
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
      queryParam: { ...QUERY_PARAM },
      deliveryRange: null,
      detailVisible: false,
      currentDetail: {},
    }
  },
  created() {
    this.getList()
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
        params.status = this.listStatus
        const res = await this.$api.getLogisticsList(params);
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
      this.deliveryRange = null
      this.getList()
    },
    handleTabActivated() {
      this.getList()
    },
    handleDeliveryRangeChange(val) {
      if (val) {
        this.queryParam.shipped_at_from = val[0]
        this.queryParam.shipped_at_to = val[1]
      } else {
        this.queryParam.shipped_at_from = ''
        this.queryParam.shipped_at_to = ''
      }
    },
    handleDetail(row) {
      this.currentDetail = row
      this.detailVisible = true
    },
    async handleSign(row) {
      await this.$confirm('确定签收该物流单?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
      try {
        await this.$api.signLogistics({ order_id: row.order_id })
        this.$message({ type: 'success', message: '签收成功' })
        this.getList()
      } catch (e) {
        this.$message({ type: 'error', message: e || '签收失败' })
      }
    },
    shipStatusText(val) {
      const map = { 0: '运输中', 1: '已签收' }
      return map[val] || '未知'
    },
    shipStatusTagType(val) {
      const map = { 0: 'primary', 1: 'success' }
      return map[val] || 'info'
    },
    orderStatusText(val) {
      const map = { 0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消' }
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
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
.no-action {
  color: #c0c4cc;
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

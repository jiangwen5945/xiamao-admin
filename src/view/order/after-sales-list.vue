<template>
  <div class="page" v-loading="loading">

    <!-- 筛选栏 -->
    <FilterBar @query="handleQuery" @reset="handleReset">
      <FilterBarItem label="状态">
        <el-select v-model="queryParam.status" placeholder="全部" clearable>
          <el-option label="待审核" :value="0" />
          <el-option label="审核通过" :value="1" />
          <el-option label="已完成" :value="2" />
          <el-option label="已拒绝" :value="3" />
        </el-select>
      </FilterBarItem>
      <FilterBarItem label="类型">
        <el-select v-model="queryParam.type" placeholder="全部" clearable>
          <el-option label="退货退款" :value="1" />
          <el-option label="仅退款" :value="3" />
        </el-select>
      </FilterBarItem>
      <FilterBarItem label="订单号">
        <el-input v-model="queryParam.order_id" placeholder="订单ID" clearable @keyup.enter="handleQuery" />
      </FilterBarItem>
    </FilterBar>

    <!-- 数据表格 -->
    <div class="table-content">
      <el-table :data="tableData" stripe>
        <el-table-column label="售后单ID" >
          <template #default="scope">
            <el-link type="primary" :underline="false" @click="handleDetail(scope.row)">
              {{ scope.row.id }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="会员" >
          <template #default="scope">
            <span>{{ scope.row.Member?.nickname || '-' }}</span>
            <span v-if="scope.row.Member?.phone" style="color:#999;margin-left:4px">({{ scope.row.Member.phone }})</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" >
          <template #default="scope">
            <el-tag :type="typeTagType(scope.row.type)" size="mini">
              {{ typeText(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" >
          <template #default="scope">
            <el-tag :type="statusTagType(scope.row.status)" size="mini">
              {{ statusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="退款金额" >
          <template #default="scope">{{ scope.row.refund_amount ? '￥' + scope.row.refund_amount : '-' }}</template>
        </el-table-column>
        <el-table-column label="申请时间">
          <template #default="scope">{{ scope.row.createdAt | dateTime }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button
              v-if="scope.row.status === 0"
              type="primary"
              size="mini"
              @click="handleReview(scope.row)"
            >审核</el-button>
            <el-button
              v-else-if="scope.row.status === 1"
              type="success"
              size="mini"
              @click="handleComplete(scope.row)"
            >完成操作</el-button>
            <span v-else class="no-action">-</span>
            <el-button
              v-if="scope.row.type === 1 && scope.row.status >= 1"
              type="text"
              size="mini"
              @click="handleToReturn(scope.row)"
            >退货物流</el-button>
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

    <!-- 审核弹窗 -->
    <el-dialog
      title="审核售后单"
      :visible="reviewVisible"
      :before-close="handleClose"
      center
      :destroy-on-close="true"
      width="560px"
    >
      <div class="review-info">
        <el-descriptions :column="2" border size="mini">
          <el-descriptions-item label="售后单ID">{{ reviewData.id }}</el-descriptions-item>
          <el-descriptions-item label="订单号">{{ reviewData.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="会员">{{ reviewData.memberText }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ typeText(reviewData.type) }}</el-descriptions-item>
          <el-descriptions-item label="申请原因" :span="2">{{ reviewData.reason || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <el-form ref="reviewForm" :model="reviewForm" label-width="100px" class="dialog-form">
        <el-form-item label="退款金额" prop="refund_amount">
          <el-input-number v-model="reviewForm.refund_amount" :precision="2" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="审核备注" prop="review_remark">
          <el-input v-model="reviewForm.review_remark" type="textarea" :rows="3" placeholder="请填写审核备注" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleClose">取 消</el-button>
        <el-button type="danger" @click="submitReject" :loading="submitting">审核拒绝</el-button>
        <el-button type="primary" @click="submitApprove" :loading="submitting">审核通过</el-button>
      </div>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      :visible.sync="detailVisible"
      title="售后单详情"
      size="520px"
      :destroy-on-close="true"
    >
      <div class="drawer-body" v-if="currentDetail.id">
        <h3 class="drawer-section-title">售后信息</h3>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="售后单ID">{{ currentDetail.id }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag :type="typeTagType(currentDetail.type)" size="mini">
              {{ typeText(currentDetail.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(currentDetail.status)" size="mini">
              {{ statusText(currentDetail.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="申请原因">{{ currentDetail.reason || '-' }}</el-descriptions-item>
          <el-descriptions-item label="退款金额">{{ currentDetail.refund_amount ? '￥' + currentDetail.refund_amount : '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核备注">{{ currentDetail.review_remark || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核时间">{{ currentDetail.review_time || '-' }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ currentDetail.createdAt | dateTime }}</el-descriptions-item>
        </el-descriptions>

        <h3 class="drawer-section-title">订单信息</h3>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="订单号">{{ currentDetail.Order?.order_no || '-' }}</el-descriptions-item>
          <el-descriptions-item label="实付金额">{{ currentDetail.Order?.actual_amount ? '￥' + currentDetail.Order.actual_amount : '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag size="mini">{{ orderStatusText(currentDetail.Order?.status) }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <h3 class="drawer-section-title">会员信息</h3>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="昵称">{{ currentDetail.Member?.nickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentDetail.Member?.phone || '-' }}</el-descriptions-item>
        </el-descriptions>

        <h3 class="drawer-section-title">售后商品</h3>
        <el-table :data="currentDetail.items || []" border size="small" style="width:100%">
          <el-table-column prop="product_name" label="商品名称" min-width="140" />
          <el-table-column prop="price" label="单价" width="90">
            <template #default="scope">￥{{ scope.row.price }}</template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="70" />
          <el-table-column prop="subtotal" label="小计" width="90">
            <template #default="scope">￥{{ scope.row.subtotal }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import dayjs from "dayjs";
import FilterBar from "@/components/filter/FilterBar";
import FilterBarItem from "@/components/filter/FilterBarItem";

const QUERY_PARAM = { page: 1, pageSize: 10, status: '', type: '', order_id: '' }
const createDefaultReviewForm = () => ({ refund_amount: 0, review_remark: '' })

export default {
  name: "AfterSalesList",
  components: { FilterBar, FilterBarItem },
  data() {
    return {
      loading: false,
      submitting: false,
      tableData: [],
      total: 0,
      queryParam: { ...QUERY_PARAM },
      reviewVisible: false,
      reviewForm: createDefaultReviewForm(),
      reviewData: {},
      detailVisible: false,
      currentDetail: {},
    };
  },

  filters: {
    dateTime(val) {
      return val ? dayjs(val).format("YYYY-MM-DD HH:mm") : '-'
    },
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
        const res = await this.$api.getAfterSalesList(params);
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
    handleDetail(row) {
      this.currentDetail = row
      this.detailVisible = true
    },
    handleReview(row) {
      this.reviewData = {
        id: row.id,
        orderNo: row.Order?.order_no || '-',
        memberText: row.Member ? `${row.Member.nickname || ''}(${row.Member.phone || ''})` : '-',
        type: row.type,
        reason: row.reason,
      }
      this.reviewForm = { refund_amount: Number(row.refund_amount) || 0, review_remark: '' }
      this.reviewVisible = true
    },
    async submitApprove() {
      this.submitting = true
      try {
        await this.$api.approveAfterSales({
          id: this.reviewData.id,
          refund_amount: this.reviewForm.refund_amount,
          review_remark: this.reviewForm.review_remark,
        })
        this.$message({ type: 'success', message: '审核通过' })
        this.handleClose()
        this.getList()
      } finally {
        this.submitting = false
      }
    },
    async submitReject() {
      if (!this.reviewForm.review_remark) {
        this.$message({ type: 'warning', message: '请填写审核备注' })
        return
      }
      this.submitting = true
      try {
        await this.$api.rejectAfterSales({
          id: this.reviewData.id,
          review_remark: this.reviewForm.review_remark,
        })
        this.$message({ type: 'success', message: '已拒绝' })
        this.handleClose()
        this.getList()
      } finally {
        this.submitting = false
      }
    },
    handleClose() {
      this.reviewForm = createDefaultReviewForm()
      this.reviewVisible = false
      this.$refs.reviewForm?.clearValidate()
    },
    async handleComplete(row) {
      this.$confirm('确认完成该售后单?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info',
      }).then(() => {
        this.$api.completeAfterSales({ id: row.id }).then(() => {
          this.$message({ type: 'success', message: '操作成功' })
          this.getList()
        })
      }).catch(err => {
        if (err === 'cancel') return
        this.$message({ type: 'error', message: err })
      })
    },
    typeText(val) {
      const map = { 1: '退货退款', 2: '换货', 3: '仅退款' }
      return map[val] || '未知'
    },
    typeTagType(val) {
      const map = { 1: 'primary', 2: 'warning', 3: 'success' }
      return map[val] || 'info'
    },
    statusText(val) {
      const map = { 0: '待审核', 1: '审核通过', 2: '已完成', 3: '已拒绝' }
      return map[val] || '未知'
    },
    statusTagType(val) {
      const map = { 0: 'warning', 1: 'success', 2: 'primary', 3: 'danger' }
      return map[val] || 'info'
    },
    handleToReturn(row) {
      this.$router.push({ path: '/logistics/return', query: { after_sales_id: row.id } })
    },
    orderStatusText(val) {
      const map = { 0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消', 5: '已退款', 6: '售后中' }
      return map[val] || '未知'
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
.dialog-form {
  padding: 10px 20px 0;
}
.review-info {
  padding: 10px 20px 0;
}
.no-action {
  color: #c0c4cc;
}
</style>

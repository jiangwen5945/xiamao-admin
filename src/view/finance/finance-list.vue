<template>
  <div class="page" v-loading="loading">
    <FilterBar @query="handleQuery" @reset="handleReset">
      <FilterBarItem label="周期类型">
        <el-select v-model="queryParam.period_type" placeholder="全部" clearable>
          <el-option label="日报" value="daily" />
          <el-option label="月报" value="monthly" />
        </el-select>
      </FilterBarItem>
      <FilterBarItem label="状态">
        <el-select v-model="queryParam.status" placeholder="全部" clearable>
          <el-option label="已完成" :value="1" />
        </el-select>
      </FilterBarItem>
    </FilterBar>

    <div class="table-header">
      <div class="left">
        <el-button type="primary" size="medium" @click="handleGenerate">生成对账</el-button>
        <CommonExcel :table-data="tableData" :columns="exportColumns" filename="对账列表" />
      </div>
    </div>

    <div class="table-content">
      <el-table :data="tableData" stripe ref="refTable">
        <el-table-column label="周期类型">
          <template #default="scope">{{ scope.row.period_type === 'daily' ? '日报' : '月报' }}</template>
        </el-table-column>
        <el-table-column label="周期" width="220">
          <template #default="scope">{{ scope.row.period_start }} 至 {{ scope.row.period_end }}</template>
        </el-table-column>
        <el-table-column label="订单数" prop="order_count" width="70" />
        <el-table-column label="商品总额">
          <template #default="scope">￥{{ scope.row.total_amount }}</template>
        </el-table-column>
        <el-table-column label="实付金额">
          <template #default="scope">￥{{ scope.row.actual_amount }}</template>
        </el-table-column>
        <el-table-column label="退款金额" >
          <template #default="scope">￥{{ scope.row.refund_amount }}</template>
        </el-table-column>
        <el-table-column label="营销抵扣">
          <template #default="scope">￥{{ scope.row.marketing_discount }}</template>
        </el-table-column>
        <el-table-column label="净收入">
          <template #default="scope">￥{{ scope.row.net_amount }}</template>
        </el-table-column>
        <el-table-column label="生成时间" width="180">
          <template #default="scope">{{ scope.row.generated_at | dateTime }}</template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button size="mini" @click="handleDetail(scope.row)">详情</el-button>
            <el-button size="mini" @click="handleItems(scope.row)">订单明细</el-button>
            <el-button size="mini" @click="handleExport(scope.row)">导出</el-button>
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

    <!-- 生成对账弹窗 -->
    <el-dialog title="生成对账" :visible="generateVisible" :before-close="handleGenerateClose" center width="500px">
      <el-form ref="generateForm" :model="generateForm" :rules="generateRules" label-width="100px">
        <el-form-item label="周期类型" prop="period_type">
          <el-select v-model="generateForm.period_type" placeholder="请选择" @change="handlePeriodChange">
            <el-option label="日报" value="daily" />
            <el-option label="月报" value="monthly" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="generateForm.period_type === 'daily'" label="日期" prop="start_date">
          <el-date-picker v-model="generateForm.start_date" type="date" placeholder="选择日期" value-format="yyyy-MM-dd" style="width:100%" />
        </el-form-item>
        <template v-if="generateForm.period_type === 'monthly'">
          <el-form-item label="开始日期" prop="start_date">
            <el-date-picker v-model="generateForm.start_date" type="date" placeholder="选择开始日期" value-format="yyyy-MM-dd" style="width:100%" />
          </el-form-item>
          <el-form-item label="结束日期" prop="end_date">
            <el-date-picker v-model="generateForm.end_date" type="date" placeholder="选择结束日期" value-format="yyyy-MM-dd" style="width:100%" />
          </el-form-item>
        </template>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleGenerateClose">取 消</el-button>
        <el-button type="primary" @click="submitGenerate" :loading="generating">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer :visible.sync="detailVisible" title="对账详情" size="520px" :destroy-on-close="true">
      <div class="drawer-body" v-if="currentDetail.id">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="周期类型">{{ currentDetail.period_type === 'daily' ? '日报' : '月报' }}</el-descriptions-item>
          <el-descriptions-item label="周期">{{ currentDetail.period_start }} ~ {{ currentDetail.period_end }}</el-descriptions-item>
          <el-descriptions-item label="订单数">{{ currentDetail.order_count }}</el-descriptions-item>
          <el-descriptions-item label="商品总额">￥{{ currentDetail.total_amount }}</el-descriptions-item>
          <el-descriptions-item label="实付金额">￥{{ currentDetail.actual_amount }}</el-descriptions-item>
          <el-descriptions-item label="退款金额">￥{{ currentDetail.refund_amount }}</el-descriptions-item>
          <el-descriptions-item label="营销抵扣">￥{{ currentDetail.marketing_discount }}</el-descriptions-item>
          <el-descriptions-item label="净收入">￥{{ currentDetail.net_amount }}</el-descriptions-item>
          <el-descriptions-item label="生成时间">{{ currentDetail.generated_at | dateTime }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentDetail.createdAt | dateTime }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ currentDetail.updatedAt | dateTime }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>

    <!-- 订单明细抽屉 -->
    <el-drawer :visible.sync="itemsVisible" title="对账订单明细" size="720px" :destroy-on-close="true">
      <div class="drawer-body">
        <el-table :data="itemsData" v-loading="itemsLoading" stripe>
          <el-table-column label="订单号" prop="order_no" min-width="160" />
          <el-table-column label="会员ID" prop="member_id" width="80" />
          <el-table-column label="商品总额" width="110">
            <template #default="scope">￥{{ scope.row.total_amount }}</template>
          </el-table-column>
          <el-table-column label="实付金额" width="110">
            <template #default="scope">￥{{ scope.row.actual_amount }}</template>
          </el-table-column>
          <el-table-column label="支付时间" width="180">
            <template #default="scope">{{ scope.row.payment_time | dateTime }}</template>
          </el-table-column>
        </el-table>
        <el-pagination
          layout="total, prev, pager, next"
          :total="itemsTotal"
          :page-size="itemsQuery.pageSize"
          :current-page.sync="itemsQuery.page"
          class="pagination"
          @current-change="handleItemsPageChange"
        />
      </div>
    </el-drawer>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import FilterBar from "@/components/filter/FilterBar";
import FilterBarItem from "@/components/filter/FilterBarItem";
import CommonExcel from "@/components/CommonExcel.vue";

const QUERY_PARAM = { page: 1, pageSize: 10, period_type: '', status: '' }

export default {
  name: "FinanceList",
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
      generateVisible: false,
      generating: false,
      generateForm: { period_type: 'monthly', start_date: '', end_date: '' },
      generateRules: {
        period_type: [{ required: true, message: '请选择周期类型', trigger: 'change' }],
        start_date: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
      },
      detailVisible: false,
      currentDetail: {},
      itemsVisible: false,
      itemsLoading: false,
      itemsData: [],
      itemsTotal: 0,
      itemsQuery: { id: '', page: 1, pageSize: 10 },
    }
  },
  computed: {
    exportColumns() {
      return [
        { label: '周期类型', formatter: (row) => row.period_type === 'daily' ? '日报' : '月报' },
        { label: '周期', formatter: (row) => `${row.period_start} 至 ${row.period_end}` },
        { label: '订单数', prop: 'order_count' },
        { label: '商品总额', prop: 'total_amount' },
        { label: '实付金额', prop: 'actual_amount' },
        { label: '退款金额', prop: 'refund_amount' },
        { label: '营销抵扣', prop: 'marketing_discount' },
        { label: '净收入', prop: 'net_amount' },
        { label: '生成时间', formatter: (row) => row.generated_at ? dayjs(row.generated_at).format('YYYY-MM-DD HH:mm:ss') : '-' },
      ]
    },
  },
  created() { this.getList() },
  activated() { this.getList() },
  methods: {
    async getList() {
      this.loading = true
      const params = { ...this.queryParam }
      Object.keys(params).forEach(k => {
        if (params[k] === '' || params[k] === null || params[k] === undefined) delete params[k]
        if (Array.isArray(params[k]) && !params[k].length) delete params[k]
      })
      try {
        const res = await this.$api.getFinanceList(params)
        this.tableData = res.list
        this.total = res.total
      } finally {
        this.loading = false
      }
    },
    handleCurrentChange(page) {
      this.queryParam.page = page
      this.getList()
    },
    handleQuery() {
      this.queryParam.page = 1
      this.getList()
    },
    handleReset() {
      this.queryParam = { ...QUERY_PARAM }
      this.getList()
    },
    handlePeriodChange(val) {
      this.generateForm.start_date = ''
      this.generateForm.end_date = ''
    },
    handleGenerate() {
      this.generateForm = { period_type: 'monthly', start_date: '', end_date: '' }
      this.generateVisible = true
    },
    handleGenerateClose() {
      this.generateVisible = false
      this.$refs.generateForm?.clearValidate()
    },
    async submitGenerate() {
      await this.$refs.generateForm.validate()
      this.generating = true
      try {
        const params = { ...this.generateForm }
        if (params.period_type === 'daily') {
          params.end_date = params.start_date
        }
        await this.$api.financeGenerate(params)
        this.$message({ type: 'success', message: '对账生成成功' })
        this.handleGenerateClose()
        this.getList()
      } catch (e) {
        // 错误已由拦截器处理
      } finally {
        this.generating = false
      }
    },
    async handleDetail(row) {
      try {
        const res = await this.$api.getFinanceDetail({ id: row.id })
        this.currentDetail = res
        this.detailVisible = true
      } catch (e) {
        this.$message({ type: 'error', message: '获取详情失败' })
      }
    },
    async handleItems(row) {
      this.itemsQuery = { id: row.id, page: 1, pageSize: 10 }
      this.itemsVisible = true
      await this.loadItems()
    },
    async handleItemsPageChange(page) {
      this.itemsQuery.page = page
      await this.loadItems()
    },
    async loadItems() {
      this.itemsLoading = true
      try {
        const res = await this.$api.getFinanceDetailItems(this.itemsQuery)
        this.itemsData = res?.list || []
        this.itemsTotal = res?.total || 0
      } catch (e) {
        this.itemsData = []
        this.itemsTotal = 0
      } finally {
        this.itemsLoading = false
      }
    },
    async handleExport(row) {
      try {
        await this.$confirm('确定导出该周期对账数据?', '提示', {
          confirmButtonText: '确定', cancelButtonText: '取消', type: 'info',
        })
      } catch (_) {
        return // 用户取消
      }

      try {
        const itemsRes = await this.$api.getFinanceDetailItems({ id: row.id, page: 1, pageSize: 99999 })

        const XLSX = await import('xlsx')

        const wb = XLSX.utils.book_new()

        // Sheet 1: 对账汇总
        const summaryHeader = ['周期', '周期类型', '订单数', '商品总额', '实付金额', '退款金额', '营销抵扣', '净收入']
        const summaryData = [
          summaryHeader,
          [`${row.period_start} ~ ${row.period_end}`, row.period_type === 'daily' ? '日报' : '月报', row.order_count, row.total_amount, row.actual_amount, row.refund_amount, row.marketing_discount, row.net_amount],
        ]
        const ws1 = XLSX.utils.aoa_to_sheet(summaryData)
        ws1['!cols'] = [{ wch: 24 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }]
        XLSX.utils.book_append_sheet(wb, ws1, '对账汇总')

        // Sheet 2: 订单明细
        const detailHeader = ['订单号', '商品总额', '实付金额', '营销抵扣', '支付时间']
        const detailData = (itemsRes.list || []).map(item => [
          item.order_no,
          parseFloat(item.total_amount || 0).toFixed(2),
          parseFloat(item.actual_amount || 0).toFixed(2),
          (parseFloat(item.total_amount || 0) - parseFloat(item.actual_amount || 0)).toFixed(2),
          item.payment_time ? dayjs(item.payment_time).format('YYYY-MM-DD HH:mm:ss') : '-',
        ])
        const ws2 = XLSX.utils.aoa_to_sheet([detailHeader, ...detailData])
        ws2['!cols'] = [
          { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 22 },
        ]
        XLSX.utils.book_append_sheet(wb, ws2, '订单明细')

        // 导出文件
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([wbout], { type: 'application/octet-stream' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `对账_${row.period_start}_${row.period_end}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } catch (e) {
        this.$message({ type: 'error', message: e.message || '导出失败' })
      }
    },
  },
}
</script>

<style scoped lang="scss">
.drawer-body {
  padding: 0 20px 20px;
}
</style>

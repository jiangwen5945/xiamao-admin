<template>
  <div class="page">
    <FilterBar @query="handleQuery" @reset="handleReset">
      <FilterBarItem label="会员">
        <el-input v-model="queryParam.member_id" placeholder="会员 ID" clearable @keyup.enter="handleQuery" />
      </FilterBarItem>
      <FilterBarItem label="状态">
        <el-select v-model="queryParam.status" placeholder="全部" clearable>
          <el-option label="未使用" :value="0" />
          <el-option label="已使用" :value="1" />
          <el-option label="已过期" :value="2" />
        </el-select>
      </FilterBarItem>
    </FilterBar>

    <div class="table-content">
      <el-table :data="tableData" stripe>
        <el-table-column prop="coupon_no" label="券码" />
        <el-table-column label="会员" >
          <template #default="scope">
            {{ scope.row.Member?.nickname || '-' }} ({{ scope.row.Member?.phone || '-' }})
          </template>
        </el-table-column>
        <el-table-column label="优惠券" >
          <template #default="scope">
            {{ scope.row.CouponDef?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="面额" >
          <template #default="scope">
            <span v-if="scope.row.CouponDef?.type === 'fixed'">¥{{ scope.row.CouponDef?.value }}</span>
            <span v-else>{{ scope.row.CouponDef?.value }}折</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" >
          <template #default="scope">
            <el-tag :type="statusType(scope.row.status)" size="mini">{{ statusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="领取时间">
          <template #default="scope">{{ scope.row.created_at | dateTime }}</template>
        </el-table-column>
        <el-table-column label="使用时间" >
          <template #default="scope">{{ scope.row.used_time | dateTime }}</template>
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
  </div>
</template>

<script>
import FilterBar from "@/components/filter/FilterBar.vue";
import FilterBarItem from "@/components/filter/FilterBarItem";
import dayjs from "dayjs";

const QUERY_PARAM = {
  page: 1,
  pageSize: 10,
  member_id: '',
  status: '',
}

export default {
  name: 'CouponIssueLog',
  components: { FilterBar, FilterBarItem },
  filters: {
    dateTime(val) {
      return val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'
    },
  },
  data() {
    return {
      tableData: [],
      total: 0,
      queryParam: { ...QUERY_PARAM },
    }
  },
  created() {
    this.getList()
  },
  activated() {
    this.getList()
  },
  methods: {
    async getList() {
      const params = { ...this.queryParam }
      const res = await this.$api.getCouponIssueLog(params)
      this.tableData = res.list
      this.total = res.total
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
    statusText(status) {
      const map = { 0: '未使用', 1: '已使用', 2: '已过期' }
      return map[status] || '-'
    },
    statusType(status) {
      const map = { 0: 'warning', 1: 'success', 2: 'info' }
      return map[status] || ''
    },
  },
}
</script>

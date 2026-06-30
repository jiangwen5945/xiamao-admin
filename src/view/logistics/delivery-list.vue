<template>
  <div class="page">
    <FilterBar @query="handleQuery" @reset="handleReset">
      <FilterBarItem label="订单号">
        <el-input v-model="filterParams.order_no" clearable @keyup.enter="handleQuery" />
      </FilterBarItem>
    </FilterBar>

    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane label="待发货" name="pending">
        <PendingTab v-if="activeTab === 'pending'" ref="pendingTab" :express-company-list="expressCompanyList" :filter-params="filterParams" />
      </el-tab-pane>
      <el-tab-pane label="已发货" name="shipped">
        <ShippedTab v-if="activeTab === 'shipped'" ref="shippedTab" :express-company-list="expressCompanyList" :filter-params="filterParams" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import FilterBar from "@/components/filter/FilterBar"
import FilterBarItem from "@/components/filter/FilterBarItem"
import PendingTab from "./components/pending-tab"
import ShippedTab from "./components/shipped-tab"

export default {
  name: "DeliveryList",
  components: { FilterBar, FilterBarItem, PendingTab, ShippedTab },
  data() {
    return {
      activeTab: 'pending',
      expressCompanyList: [],
      filterParams: {
        order_no: '',
      },
    }
  },
  created() {
    this.loadExpressCompany()
    const orderNo = this.$route.query.order_no
    if (orderNo) {
      this.filterParams.order_no = orderNo
    }
  },
  activated() {
    this.loadExpressCompany()
    this.$nextTick(() => {
      const ref = this.activeTab === 'pending' ? 'pendingTab' : 'shippedTab'
      if (this.$refs[ref]) {
        this.$refs[ref].getList()
      }
    })
  },
  methods: {
    async loadExpressCompany() {
      try {
        const res = await this.$api.getDictList('express_company')
        this.expressCompanyList = res
      } catch {
        this.expressCompanyList = []
      }
    },
    handleQuery() {
      const ref = this.activeTab === 'pending' ? 'pendingTab' : 'shippedTab'
      if (this.$refs[ref]) this.$refs[ref].handleFilterQuery()
    },
    handleReset() {
      this.filterParams = { order_no: '' }
      const ref = this.activeTab === 'pending' ? 'pendingTab' : 'shippedTab'
      if (this.$refs[ref]) this.$refs[ref].handleFilterReset()
    },
    handleTabClick() {
      const ref = this.activeTab === 'pending' ? 'pendingTab' : 'shippedTab'
      if (this.$refs[ref]) this.$refs[ref].getList()
    },
  }
}
</script>

<template>
  <div class="page">
    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane label="待发货" name="pending">
        <PendingTab v-if="activeTab === 'pending'" ref="pendingTab" :express-company-list="expressCompanyList" />
      </el-tab-pane>
      <el-tab-pane label="运输中" name="transit">
        <ShippedTab v-if="activeTab === 'transit'" ref="transitTab" :express-company-list="expressCompanyList" :list-status="0" />
      </el-tab-pane>
      <el-tab-pane label="已签收" name="signed">
        <ShippedTab v-if="activeTab === 'signed'" ref="signedTab" :express-company-list="expressCompanyList" :list-status="1" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import PendingTab from "./components/pending-tab"
import ShippedTab from "./components/shipped-tab"

export default {
  name: "DeliveryList",
  components: { PendingTab, ShippedTab },
  data() {
    return {
      activeTab: 'pending',
      expressCompanyList: [],
    }
  },
  created() {
    this.loadExpressCompany()
  },
  activated() {
    this.loadExpressCompany()
    this.$nextTick(() => {
      const refMap = { pending: 'pendingTab', transit: 'transitTab', signed: 'signedTab' }
      const ref = refMap[this.activeTab]
      if (ref && this.$refs[ref]) {
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
    handleTabClick() {
      // v-if 切换会重新创建子组件自动请求数据
    }
  }
}
</script>

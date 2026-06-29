<template>
  <div class="page" v-loading="loading">
    <div class="time-range-bar">
      <span class="time-range-label">时间范围：</span>
      <el-radio-group :value="timeRange" size="mini" @change="handleTimeChange">
        <el-radio-button :label="7">近 7 日</el-radio-button>
        <el-radio-button :label="30">近 30 日</el-radio-button>
        <el-radio-button :label="90">近 90 日</el-radio-button>
      </el-radio-group>
    </div>

    <div class="count-wrap">
      <div class="count-card" style="background: linear-gradient(135deg,#667eea,#764ba2)">
        <i class="el-icon-s-finance count-icon"></i>
        <div class="count-body">
          <p class="count-value">￥{{ overview.total_income }}</p>
          <p class="count-label">总收入</p>
        </div>
      </div>
      <div class="count-card" style="background: linear-gradient(135deg,#f093fb,#f5576c)">
        <i class="el-icon-sold-out count-icon"></i>
        <div class="count-body">
          <p class="count-value">￥{{ overview.total_refund }}</p>
          <p class="count-label">总退款</p>
        </div>
      </div>
      <div class="count-card" style="background: linear-gradient(135deg,#4facfe,#00f2fe)">
        <i class="el-icon-money count-icon"></i>
        <div class="count-body">
          <p class="count-value">￥{{ overview.total_net }}</p>
          <p class="count-label">净收入</p>
        </div>
      </div>

    </div>

    <div class="card card-spacing">
      <div class="card-header"><span>{{ periodLabel }}财务趋势</span></div>
      <div ref="trendChart" style="height: 320px"></div>
    </div>

    <div class="card card-spacing">
      <div class="card-header"><span>对账记录</span></div>
      <div class="table-content">
        <el-table :data="recentRecords" stripe @row-click="goToDetail">
          <el-table-column label="周期类型">
            <template #default="scope">{{ scope.row.period_type === 'daily' ? '日报' : '月报' }}</template>
          </el-table-column>
          <el-table-column label="周期" width="220">
            <template #default="scope">{{ scope.row.period_start }} ~ {{ scope.row.period_end }}</template>
          </el-table-column>
          <el-table-column label="订单数" prop="order_count" width="70" />
          <el-table-column label="实付金额">
            <template #default="scope">￥{{ scope.row.actual_amount }}</template>
          </el-table-column>
          <el-table-column label="退款金额" >
            <template #default="scope">￥{{ scope.row.refund_amount }}</template>
          </el-table-column>
          <el-table-column label="净收入" >
            <template #default="scope">￥{{ scope.row.net_amount }}</template>
          </el-table-column>
          <el-table-column label="生成时间" width="180">
          <template #default="scope">{{ scope.row.generated_at | dateTime }}</template>
        </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import dayjs from 'dayjs'

export default {
  name: 'FinanceOverview',
  filters: {
    dateTime(val) {
      return val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
  },
  data() {
    return {
      loading: false,
      timeRange: 7,
      periodLabel: '近 7 日',
      overview: {
        total_income: '0.00',
        total_refund: '0.00',
        total_net: '0.00',

        recent_trend: [],
      },
      recentRecords: [],
    }
  },
  created() { this.loadData() },
  activated() { this.loadData() },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const [overview, listRes] = await Promise.all([
          this.$api.getFinanceOverview({ days: this.timeRange }),
          this.$api.getFinanceList({ page: 1, pageSize: 5 })
        ])
        this.overview = overview
        this.recentRecords = listRes.list || []
        this.$nextTick(() => this.initChart())
      } finally {
        this.loading = false
      }
    },
    handleTimeChange(val) {
      const labels = { 7: '近 7 日', 30: '近 30 日', 90: '近 90 日' }
      this.periodLabel = labels[val] || '近 7 日'
      this.loadData()
    },
    initChart() {
      const chart = echarts.init(this.$refs.trendChart)
      const trend = this.overview.recent_trend
      if (!trend || !trend.length) {
        chart.setOption({ title: { text: '暂无数据', left: 'center', top: 'center' } })
        return
      }
      chart.setOption({
        legend: { data: ['实付金额', '退款金额', '净收入'] },
        grid: { left: 60, right: 60, bottom: 30, top: 40 },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: trend.map(r => dayjs(r.period_start).format('MM-DD')), boundaryGap: false },
        yAxis: { type: 'value', name: '金额（元）', min: 0 },
        series: [
          { name: '实付金额', type: 'line', smooth: true, data: trend.map(r => parseFloat(r.actual_amount || 0)), lineStyle: { width: 2 }, areaStyle: { opacity: 0.1 } },
          { name: '退款金额', type: 'line', smooth: true, data: trend.map(r => parseFloat(r.refund_amount || 0)), lineStyle: { width: 2 }, areaStyle: { opacity: 0.1 } },
          { name: '净收入', type: 'line', smooth: true, data: trend.map(r => parseFloat(r.net_amount || 0)), lineStyle: { width: 2 }, areaStyle: { opacity: 0.1 } },
        ],
      })
    },
    goToDetail() {
      this.$router.push('/finance/list')
    },
  },
}
</script>

<style scoped lang="scss">
.time-range-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;

  .time-range-label {
    font-size: 14px;
    color: #606266;
    margin-right: 12px;
    white-space: nowrap;
  }
}

.count-wrap {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  .count-card {
    display: flex;
    align-items: center;
    padding: 24px 28px;
    border-radius: 8px;
    color: #fff;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    .count-icon {
      font-size: 36px;
      margin-right: 20px;
      opacity: 0.9;
    }

    .count-body {
      .count-value {
        font-size: 26px;
        font-weight: 700;
        margin: 0;
        line-height: 1.3;
      }
      .count-label {
        font-size: 13px;
        margin: 4px 0 0;
        opacity: 0.8;
      }
    }
  }
}

.card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  &-spacing {
    margin-top: 16px;
  }

  &-header {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 16px;
    padding-left: 12px;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 16px;
      border-radius: 2px;
      background: linear-gradient(180deg, #667eea, #764ba2);
    }
  }
}
</style>

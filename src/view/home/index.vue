<template>
  <div class="dashboard">
     <!-- 顶部 -->
    <div class="dashboard-top">
      <div class="card">
        <div class="card-header">
          <span>常用操作</span>
        </div>
        <div class="quick-actions">
          <div
            class="quick-item"
            v-for="item in quickActions"
            :key="item.label"
            @click="goTo(item.path)"
          >
            <span class="quick-icon" :style="{ background: item.bg }">
              <i :class="`el-icon-${item.icon}`"></i>
            </span>
            <span class="quick-label">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </div>
    <!-- 左侧栏 -->
    <div class="dashboard-left">
      <!-- 当前用户信息卡片 -->
      <div class="card">
        <div class="user-wrap">
          <div class="user-img">
            <el-image
              style="width: 80px; height: 80px; border-radius: 50%"
              :src="userInfo.avatar"
            ></el-image>
          </div>
          <div class="user-info">
            <p class="name">{{ userInfo.nickname || userInfo.username }}</p>
            <p class="role">
              {{
                currentRoleName ||
                (userInfo.Roles &&
                  userInfo.Roles[0] &&
                  userInfo.Roles[0].name) ||
                "-"
              }}
            </p>
            <p class="dept">
              <i class="el-icon-office-building"></i>
              {{ userInfo.Department?.name || "未分配部门" }}
            </p>
          </div>
        </div>
        <div class="login-info">
          <p><span>上次登录时间：</span>2025-06-23 14:30:00</p>
          <p><span>上次登录地点：</span>福建省 三明市</p>
        </div>
      </div>

      <!-- 最新订单列表 -->
      <div class="card card-spacing order-card">
        <div class="card-header">
          <span>最新订单</span>
          <el-button type="text" @click="goTo('order/OrderList')"
            >查看全部</el-button
          >
        </div>
        <div class="order-table-wrap">
          <el-table
            :data="latestOrders.slice(0, 8)"
            style="width: 100%"
            size="small"
            v-loading="orderLoading"
          >
            <el-table-column prop="order_no" label="订单号" min-width="120" show-overflow-tooltip/>
            <el-table-column label="金额" width="80">
              <template #default="scope"
                >¥{{ scope.row.total_amount || scope.row.total || 0 }}</template
              >
            </el-table-column>
            <el-table-column label="状态" width="70">
              <template #default="scope">
                <el-tag
                  :type="orderStatusMap[scope.row.status]?.type || 'info'"
                  size="mini"
                >
                  {{
                    orderStatusMap[scope.row.status]?.label || scope.row.status
                  }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="下单时间" min-width="140">
              <template #default="scope">{{ scope.row.createdAt | dateTime }}</template>
            </el-table-column>
          </el-table>
          <div class="order-empty" v-if="!latestOrders.length && !orderLoading">
            暂无订单数据
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧栏 -->
    <div class="dashboard-right">
      <!-- 统计总览卡片 -->
      <div class="count-wrap">
        <div
          class="count-card"
          :class="item.spanRows === 2 ? 'span-rows': ''"
          v-for="item in countData"
          :key="item.name"
          :style="{ background: item.bg }"
        >
          <i :class="`el-icon-${item.icon}`" class="count-icon"></i>
          <div class="count-body">
            <p class="count-value">{{ item.value }}</p>
            <p class="count-label">{{ item.name }}</p>
            <p class="count-diff" v-if="item.diff">{{ item.diff }}</p>
          </div>
        </div>
      </div>

      <!-- 近 7 日销售趋势折线图 -->
      <div class="card card-spacing">
        <div class="card-header">
          <span>近 7 日销售趋势</span>
        </div>
        <div ref="echarts1" style="height: 260px"></div>
      </div>

      <!-- 柱状图 + 饼图并排 -->
      <div class="graph-wrap">
        <div class="card">
          <div class="card-header">
            <span>热销商品 TOP10</span>
          </div>
          <div ref="echarts2" style="height: 240px"></div>
        </div>
        <div class="card">
          <div class="card-header">
            <span>商品分类</span>
          </div>
          <div ref="echarts3" style="height: 240px"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from "echarts";
import dayjs from "dayjs";

export default {
  name: "HomeView",
  filters: {
    dateTime(val) {
      return dayjs(val).format("YYYY-MM-DD HH:mm")
    },
  },
  data() {
    return {
      dashboardData: null,
      dashboardLoading: false,
      // 统计总览卡片
      countData: [
         {
          name: "今日销售额",
          value: "-",
          icon: "money",
          bg: "linear-gradient(135deg,#667eea,#764ba2)",
          spanRows: 2,
          diff: '-'
        },
        {
          name: "今日订单",
          value: "-",
          icon: "s-order",
          bg: "linear-gradient(135deg,#f093fb,#f5576c)",
          spanRows: 2,
          diff: '-'
        },
        {
          name: "总销售额",
          value: "-",
          icon: "s-finance",
          bg: "linear-gradient(135deg,#a18cd1,#fbc2eb)",
        },
         {
          name: "全部订单",
          value: "-",
          icon: "s-data",
          bg: "linear-gradient(135deg,#f6d365,#fda085)",
        },
        {
          name: "商品总数",
          value: "-",
          icon: "goods",
          bg: "linear-gradient(135deg,#4facfe,#00f2fe)",
        },
        {
          name: "会员总数",
          value: "-",
          icon: "user",
          bg: "linear-gradient(135deg,#43e97b,#38f9d7)",
        },
      ],
      // 最新订单列表
      latestOrders: [],
      orderLoading: false,
      // 快捷操作列表
      quickActions: [
        { label: '商品列表', icon: 'plus', bg: '#667eea', path: 'goods/list' },
        { label: '订单管理', icon: 's-order', bg: '#f5576c', path: 'order/list' },
        { label: '会员管理', icon: 'user', bg: '#4facfe', path: 'member/list' },
        { label: '商品分类', icon: 'setting', bg: '#43e97b', path: 'goods/category' },
      ],
      // 订单状态 → 标签映射
      orderStatusMap: [
        { label: "待支付", type: "warning" },
        { label: "已支付", type: "primary" },
        { label: "已发货", type: "" },
        { label: "已完成", type: "success" },
        { label: "已取消", type: "danger" },
      ],
    };
  },
  computed: {
    // 从 Vuex store 获取用户信息，兜底从 localStorage 读取
    userInfo() {
      return (
        this.$store.state.tab.userInfo ||
        JSON.parse(localStorage.getItem("userInfo") || "{}")
      );
    },
    // 获取当前选中的角色名称
    currentRoleName() {
      const role = this.$store.state.tab.currentRole;
      return role ? role.name : null;
    },
  },
  async mounted() {
    await this.getDashboardData();
    this.getOrders();
  },
  // keep-alive 激活时刷新数据
  async activated() {
    await this.getDashboardData();
    this.getOrders();
  },
  methods: {
    // 获取仪表盘全部数据
    async getDashboardData() {
      this.dashboardLoading = true;
      try {
        const res = await this.$api.getDashboardData();
        this.dashboardData = res;
        // 更新统计卡片
        const kpi = res.kpi || {};
        const keyMap = {
          "今日销售额": "today_sales",
          "今日订单": "today_orders",
          "总销售额": "total_sales",
          "全部订单": "total_orders",
          "商品总数": "total_products",
          "会员总数": "total_members",
        };
        this.countData = this.countData.map((item) => {
          const key = keyMap[item.name];
          let value = kpi[key];
          if (value == null) value = "-";
          else if (item.name.includes("销售额")) value = "¥ " + value.toLocaleString();
          else value = String(value);
          return { ...item, value };
        });
        this.$nextTick(() => this.initChart());
      } catch (e) {
        console.warn("获取仪表盘数据失败", e);
      } finally {
        this.dashboardLoading = false;
      }
    },
    // 获取最新订单
    async getOrders() {
      this.orderLoading = true;
      try {
        const res = await this.$api.getOrderList({ page: 1, pageSize: 10 });
        this.latestOrders = res.list || [];
      } catch {
        this.latestOrders = [];
      } finally {
        this.orderLoading = false;
      }
    },
    // 快捷导航到指定页面
    goTo(path) {
      this.$router.push(path.startsWith("/") ? path : "/" + path);
    },
    // 初始化所有图表
    initChart() {
      const data = this.dashboardData;
      if (!data) return;
      this.initLineChart(data.sales_trend);
      this.initBarChart(data.top_products);
      this.initPieChart(data.category_sales);
    },
    // 折线图：近 7 日销售趋势（双 Y 轴）
    initLineChart(salesTrend) {
      const chart = echarts.init(this.$refs.echarts1);
      if (!salesTrend || !salesTrend.length) {
        chart.setOption({ title: { text: "暂无数据", left: "center", top: "center" } });
        return;
      }
      // 取最近 7 天
      const recent = salesTrend.slice(-7);
      const dates = recent.map((r) => dayjs(r.date).format("MM-DD"));
      chart.setOption({
        legend: { data: ["销售额", "订单量"] },
        grid: { left: 60, right: 60, bottom: 20, top: 30 },
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: dates, boundaryGap: false },
        yAxis: [
          { type: "value", name: "销售额（元）", min: 0 },
          { type: "value", name: "订单量", min: 0 },
        ],
        series: [
          {
            name: "销售额",
            type: "line",
            smooth: true,
            yAxisIndex: 0,
            data: recent.map((r) => r.amount),
          },
          {
            name: "订单量",
            type: "line",
            smooth: true,
            yAxisIndex: 1,
            data: recent.map((r) => r.orders),
          },
        ],
      });
    },
    // 柱状图：热销商品 TOP10
    initBarChart(topProducts) {
      const chart = echarts.init(this.$refs.echarts2);
      if (!topProducts || !topProducts.length) {
        chart.setOption({ title: { text: "暂无数据", left: "center", top: "center" } });
        return;
      }
      chart.setOption({
        grid: { left: 40, right: 20, bottom: 50, top: 10 },
        tooltip: { trigger: "axis" },
        xAxis: {
          type: "category",
          data: topProducts.map((r) => r.name),
          axisLabel: { rotate: 30, fontSize: 10 },
        },
        yAxis: { type: "value" },
        series: [
          {
            type: "bar",
            data: topProducts.map((r) => ({
              value: r.amount,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "#4facfe" },
                  { offset: 1, color: "#00f2fe" },
                ]),
              },
            })),
            barWidth: 22,
            borderRadius: [4, 4, 0, 0],
          },
        ],
      });
    },
    // 饼图（环形图）：商品分类
    initPieChart(categorySales) {
      const chart = echarts.init(this.$refs.echarts3);
      if (!categorySales || !categorySales.length) {
        chart.setOption({ title: { text: "暂无数据", left: "center", top: "center" } });
        return;
      }
      chart.setOption({
        tooltip: { trigger: "item", formatter: "{b}: ¥{c}" },
        series: [
          {
            type: "pie",
            radius: ["45%", "70%"],
            center: ["50%", "50%"],
            avoidLabelOverlap: true,
            label: { show: false },
            emphasis: {
              label: { show: true, fontSize: 14, fontWeight: "bold" },
            },
            data: categorySales.map((r) => ({ name: r.name, value: r.amount })),
          },
        ],
      });
    },
  },
};
</script>

<style scoped lang="scss">
.dashboard {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;

  .dashboard-top {
    grid-column: 1/-1;
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
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 16px;
    padding-left: 12px;
    position: relative;

    &::before {
      content: "";
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

.user-wrap {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #eee;
  margin-bottom: 16px;
  padding-bottom: 16px;

  .user-img {
    margin-right: 20px;
  }

  .user-info {
    .name {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 4px;
      color: #303030;
    }

    .role {
      font-size: 13px;
      color: #667eea;
      margin-bottom: 4px;
    }

    .dept {
      font-size: 12px;
      color: #999;

      i {
        margin-right: 2px;
      }
    }
  }
}

.login-info {
  p {
    line-height: 26px;
    font-size: 13px;
    color: #666;

    span {
      color: #999;
    }
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;

  .quick-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #f4f6f9;
    }

    .quick-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 18px;
      flex-shrink: 0;
    }

    .quick-label {
      font-size: 13px;
      color: #333;
    }
  }
}

.quick-card {
  grid-column: 1 / -1;
  margin-top: 16px;
}

.count-wrap {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;

  .count-card {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 16px 20px;
    border-radius: 8px;
    color: #fff;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    &.span-rows {
      grid-row: span 2;

      .count-icon {
        font-size: 34px;
      }

      .count-body .count-value {
        font-size: 24px;
      }
    }

    .count-icon {
      font-size: 24px;
      margin-right: 10px;
      opacity: 0.9;
    }

    .count-body {
      .count-value {
        font-size: 18px;
        font-weight: 700;
        margin: 0;
        line-height: 1.3;
      }

      .count-label {
        font-size: 11px;
        margin: 2px 0 0;
        opacity: 0.8;
      }

      .count-diff {
        font-size: 11px;
        margin: 2px 0 0;
        opacity: 0.7;
      }
    }
  }
}

.graph-wrap {
  display: flex;
  gap: 16px;
  margin-top: 16px;

  .card {
    flex: 1;
  }
}

.order-card {
  min-height: 454px;
  max-width: 428px;
  display: flex;
  flex-direction: column;

  .order-table-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .order-empty {
    text-align: center;
    color: #999;
    padding: 32px 0;
    font-size: 14px;
  }
}
</style>

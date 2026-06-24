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
      <!-- 4 个统计总览卡片 -->
      <div class="count-wrap">
        <div
          class="count-card"
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
            <span>分类销量分布</span>
          </div>
          <div ref="echarts2" style="height: 240px"></div>
        </div>
        <div class="card">
          <div class="card-header">
            <span>订单状态分布</span>
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

// ---------- 图表静态数据 ----------

// 近 7 日日期标签
const weekDays = [
  "06-17",
  "06-18",
  "06-19",
  "06-20",
  "06-21",
  "06-22",
  "06-23",
];

// 折线图：销售额 + 订单量双线
const lineData = {
  date: weekDays,
  data: [
    { 销售额: 3200, 订单量: 28 },
    { 销售额: 4800, 订单量: 35 },
    { 销售额: 3600, 订单量: 22 },
    { 销售额: 6200, 订单量: 41 },
    { 销售额: 5400, 订单量: 38 },
    { 销售额: 7800, 订单量: 52 },
    { 销售额: 8600, 订单量: 46 },
  ],
};

// 柱状图：各分类销量
const barData = [
  { name: "数码", value: 320 },
  { name: "服装", value: 480 },
  { name: "食品", value: 260 },
  { name: "家电", value: 540 },
  { name: "图书", value: 190 },
];

// 饼图：订单状态占比
const pieData = [
  { name: "待支付", value: 15 },
  { name: "已支付", value: 30 },
  { name: "已发货", value: 25 },
  { name: "已完成", value: 42 },
  { name: "已取消", value: 8 },
];

export default {
  name: "HomeView",
  filters: {
    dateTime(val) {
      return dayjs(val).format("YYYY-MM-DD HH:mm")
    },
  },
  data() {
    return {
      // 统计总览卡片配置（name 与 API 返回的 label 匹配时自动覆盖 value）
      countData: [
        {
          name: "今日销售额",
          value: "¥ 12,860",
          icon: "money",
          bg: "linear-gradient(135deg,#667eea,#764ba2)",
          diff: "较昨日 +12%",
        },
        {
          name: "今日订单",
          value: "24",
          icon: "s-order",
          bg: "linear-gradient(135deg,#f093fb,#f5576c)",
          diff: "待处理 3",
        },
        {
          name: "商品总数",
          value: "0",
          icon: "goods",
          bg: "linear-gradient(135deg,#4facfe,#00f2fe)",
        },
        {
          name: "会员总数",
          value: "0",
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
    this.getCountData();
    this.getOrders();
    this.initChart();
  },
  // keep-alive 激活时刷新数据
  activated() {
    this.getOrders();
    this.getCountData();
  },
  methods: {
    // 从 API 获取商品和会员总数，更新统计卡片
    async getCountData() {
      try {
        const [productRes, memberRes] = await Promise.all([
          this.$api
            .getProductList()
            .catch(() => ({ total: 0 })),
          this.$api
            .getMemberList()
            .catch(() => ({ total: 0 })),
        ]);
        const labels = {
          商品总数: productRes.total || 0,
          会员总数: memberRes.total || 0,
        };
        this.countData = this.countData.map((item) => ({
          ...item,
          value:
            labels[item.name] !== undefined
              ? String(labels[item.name])
              : item.value,
        }));
      } catch (e) {
        console.warn(e);
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
      this.initLineChart();
      this.initBarChart();
      this.initPieChart();
    },
    // 折线图：近 7 日销售额 + 订单量趋势
    initLineChart() {
      const chart = echarts.init(this.$refs.echarts1);
      const legendKeys = Object.keys(lineData.data[0]);
      const series = legendKeys.map((key) => ({
        name: key,
        type: "line",
        smooth: true,
        data: lineData.data.map((item) => item[key]),
      }));
      chart.setOption({
        legend: { data: legendKeys },
        grid: { left: 50, right: 20, bottom: 20, top: 30 },
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: lineData.date, boundaryGap: false },
        yAxis: { type: "value" },
        series,
      });
    },
    // 柱状图：分类销量分布（渐变柱体）
    initBarChart() {
      const chart = echarts.init(this.$refs.echarts2);
      chart.setOption({
        grid: { left: 40, right: 20, bottom: 30, top: 10 },
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: barData.map((item) => item.name) },
        yAxis: { type: "value" },
        series: [
          {
            type: "bar",
            data: barData.map((item) => ({
              value: item.value,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "#4facfe" },
                  { offset: 1, color: "#00f2fe" },
                ]),
              },
            })),
            barWidth: 28,
            borderRadius: [4, 4, 0, 0],
          },
        ],
      });
    },
    // 饼图（环形图）：订单状态分布
    initPieChart() {
      const chart = echarts.init(this.$refs.echarts3);
      chart.setOption({
        tooltip: { trigger: "item" },
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
            data: pieData,
          },
        ],
      });
    },
  },
};
</script>

<style scoped lang="scss">
/* 仪表盘 Grid 两栏布局，两列等高 */
.dashboard {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
}

.dashboard-top {
  grid-column: 1/-1;
}

/* 自定义卡片 */
.card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-spacing {
  margin-top: 16px;
}

.card-header {
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

/* ---------- 用户信息卡片 ---------- */
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

/* ---------- 快捷操作 ---------- */

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

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

/* 快捷操作卡片独占一行 */
.quick-card {
  grid-column: 1 / -1;
  margin-top: 16px;
}

/* ---------- 统计总览卡片 ---------- */
.count-wrap {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.count-card {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-radius: 8px;
  color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.count-icon {
  font-size: 32px;
  margin-right: 14px;
  opacity: 0.9;
}

.count-body {
  .count-value {
    font-size: 22px;
    font-weight: 700;
    margin: 0;
    line-height: 1.3;
  }
  .count-label {
    font-size: 12px;
    margin: 2px 0 0;
    opacity: 0.8;
  }
  .count-diff {
    font-size: 11px;
    margin: 2px 0 0;
    opacity: 0.7;
  }
}

/* ---------- 图表并排区域 ---------- */
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
}

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
</style>

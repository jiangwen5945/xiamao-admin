<template>
  <div>
    <el-row :gutter="20">
      <el-col :span="8">
        <!-- 当前用户信息卡片 -->
        <el-card>
          <div class="user-wrap">
            <div class="user-img">
              <el-image
                style="width: 150px; height: 150px; border-radius: 50%"
                :src="userInfo.avatar"
              ></el-image>
            </div>
            <div class="user-info">
              <p class="name">{{ userInfo.nickname }}</p>
              <p class="access">{{ currentRoleName || (userInfo.Roles && userInfo.Roles[0] && userInfo.Roles[0]['name']) || '' }}</p>
            </div>
          </div>
          <div class="login-info">
            <p>上次登录时间： <span>2022-02-02</span></p>
            <p>上次登录地点： <span>三明</span></p>
          </div>
        </el-card>
        <!-- 数据列表卡片 -->
        <el-card class="data-card">
          <el-table :data="tableData" style="width: 100%">
            <el-table-column prop="name" label="商品"></el-table-column>
            <el-table-column prop="todayBuy" label="今日销量"></el-table-column>
            <el-table-column prop="monthBuy" label="本月销量"></el-table-column>
            <el-table-column prop="totalBuy" label="总销量"></el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="16">
        <!-- 统计总览 -->
        <div class="count-wrap">
          <div class="card" v-for="item in countData" :key="item.name">
            <i
              :class="`el-icon-${item.icon}`"
              :style="{ background: item.color }"
              class="count-icon"
            ></i>
            <div class="detail">
              <p class="price">{{ item.value }}</p>
              <p class="desc">{{ item.name }}</p>
            </div>
          </div>
        </div>
        <!-- 折线图 -->
        <el-card>
          <div ref="echarts1" style="height: 280px"></div>
        </el-card>

        <!-- 柱状图&饼状图 -->
        <div class="graph-wrap">
          <el-card>
            <div ref="echarts2" style="height: 260px"></div>
          </el-card>
          <el-card>
            <div ref="echarts3" style="height: 260px"></div>
          </el-card>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { getData } from "@/api/index";
import * as echarts from "echarts";

export default {
  name: "HomeView",
  data() {
    return {
      pieData: [],
      lineData: [],
      barData: [],
      tableData: [],
      countData: [],
    };
  },
  activated() {
    // this.getHomeData(); // 缓存组件激活时候重新获取数据，避免数据不能及时更新
    console.log("缓存组件激活时候重新获取数据");
  },
  async mounted() {
    // await this.getHomeData();
    // this.initChart();
    console.log("首页mounted");
  },
  computed: {
    userInfo() {
      return (
        this.$store.state.tab.userInfo ||
        JSON.parse(localStorage.getItem("userInfo"))
      );
    },
    currentRoleName() {
      const role = this.$store.state.tab.currentRole
      return role ? role.name : null
    },
  },
  methods: {
    // 获取首页数据
    getHomeData() {
    //   return getData().then((data) => {
    //     const { pieData, lineData, barData, tableData, countData } = data;
    //     this.pieData = pieData;
    //     this.lineData = lineData;
    //     this.barData = barData;
    //     this.tableData = tableData;
    //     this.countData = countData;
    //   });
    },
    // 初始化Echarts
    initChart() {
      /** 折线图 */
      const echarts1 = echarts.init(this.$refs.echarts1);
      // 处理图例的种类
      const legendStyle = Object.keys(this.lineData.data[0]);
      // 处理折线图类别的数据
      const seriesData = [];
      legendStyle.forEach((e) => {
        seriesData.push({
          name: e,
          data: this.lineData.data.map((item) => item[e]),
          type: "line",
        });
      });
      echarts1.setOption({
        legend: { data: legendStyle },
        xAxis: {
          data: this.lineData.date,
        },
        yAxis: {},
        tooltip: {
          trigger: "axis",
        },
        series: seriesData,
      });

      /** 柱状图 */
      const echarts2 = echarts.init(this.$refs.echarts2);
      // 处理图例的种类
      echarts2.setOption({
        xAxis: {
          data: this.barData.map((item) => item.date),
        },
        yAxis: {},
        legend: { data: ["新增用户", "活跃用户"] },
        // 提示框
        tooltip: {
          trigger: "axis",
        },
        series: [
          {
            name: "新增用户",
            data: this.barData.map((item) => item.new),
            type: "bar",
          },
          {
            name: "活跃用户",
            data: this.barData.map((item) => item.active),
            type: "bar",
          },
        ],
      });

      // 饼状图
      const echarts3 = echarts.init(this.$refs.echarts3);
      echarts3.setOption({
        series: [
          {
            type: "pie",
            data: this.pieData,
            radius: "60%",
          },
        ],
      });
    },
  },
};
</script>

<style scoped lang="scss">
.user-wrap {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
  padding-bottom: 20px;

  .user-img {
    margin-right: 40px;
  }

  .user-info {
    .name {
      font-size: 32px;
      margin-bottom: 10px;
    }

    .access {
      color: #999;
    }
  }
}

.login-info {
  p {
    line-height: 28px;
    font-size: 14px;
    color: #000;

    span {
      color: #666;
      margin-left: 60px;
    }
  }
}

.data-card {
  margin-top: 20px;
  min-height: 490px;
}

// 统计总览
.count-wrap {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;

  .card {
    background: #fff;
    display: flex;
    flex: 0 0 32%;
    margin-bottom: 20px;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }

  .count-icon {
    width: 80px;
    height: 80px;
    font-size: 30px;
    text-align: center;
    line-height: 80px;
    color: #fff;
  }

  .detail {
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-left: 14px;

    p {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
    }

    .price {
      font-size: 22px;
      margin-top: 10px;
      color: #303030;
    }

    .desc {
      font-size: 14px;
      color: #999;
      text-align: center;
    }
  }
}

.graph-wrap {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;

  .el-card {
    width: 49%;
    height: 260px;
  }
}
</style>

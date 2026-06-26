<template>
  <div class="page">
    <!-- 筛选栏 -->
    <FilterBar @query="handleQuery" @reset="handleReset">
      <FilterBarItem label="操作人">
        <el-input
          v-model="queryParam.username"
          placeholder=""
          clearable
          @keyup.enter="handleQuery"
        />
      </FilterBarItem>
      <FilterBarItem label="模块">
        <el-input
          v-model="queryParam.module"
          placeholder=""
          clearable
          @keyup.enter="handleQuery"
        />
      </FilterBarItem>
      <FilterBarItem label="操作类型">
        <el-input
          v-model="queryParam.action"
          placeholder=""
          clearable
          @keyup.enter="handleQuery"
        />
      </FilterBarItem>
      <FilterBarItem label="日期范围">
        <el-date-picker
          v-model="queryParam.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd"
          clearable
          @change="handleQuery"
        />
      </FilterBarItem>
    </FilterBar>

    <!-- 操作栏 -->
    <div class="table-header">
      <div class="left">
        <el-button
          type="danger"
          size="medium"
          :disabled="!selectedIds.length"
          @click="handleDelete(selectedIds)"
        >删除选中</el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-content">
      <el-table
        :data="tableData"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="45" />
        <el-table-column prop="username" label="操作人" />
        <el-table-column prop="module" label="模块" />
        <el-table-column prop="action" label="操作类型" />
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column prop="method" label="请求方法" />
        <el-table-column label="结果" >
          <template #default="scope">
            <el-tag
              :type="scope.row.result === 'success' ? 'success' : 'danger'"
              size="mini"
            >
              {{ scope.row.result === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP" />
        <el-table-column prop="duration" label="耗时(ms)" />
        <el-table-column prop="createdAt" label="操作时间" width="180">
          <template #default="scope">
            {{ scope.row.createdAt | dateTime }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button size="mini" @click="handleDetail(scope.row)">详情</el-button>
            <el-button type="danger" size="mini" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        layout="total, prev, pager, next, sizes"
        :total="total"
        :page-size="queryParam.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :current-page.sync="queryParam.page"
        class="pagination"
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 详情抽屉 -->
    <el-drawer
      :visible.sync="detailVisible"
      title="日志详情"
      size="520px"
      :destroy-on-close="true"
    >
      <div class="drawer-body" v-if="currentDetail.id">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="操作人">{{ currentDetail.username }}</el-descriptions-item>
          <el-descriptions-item label="操作人 ID">{{ currentDetail.user_id }}</el-descriptions-item>
          <el-descriptions-item label="模块">{{ currentDetail.module }}</el-descriptions-item>
          <el-descriptions-item label="操作类型">{{ currentDetail.action }}</el-descriptions-item>
          <el-descriptions-item label="业务描述">{{ currentDetail.description }}</el-descriptions-item>
          <el-descriptions-item label="请求路径">{{ currentDetail.path }}</el-descriptions-item>
          <el-descriptions-item label="请求方法">{{ currentDetail.method }}</el-descriptions-item>
          <el-descriptions-item label="请求参数">
            <pre class="json-block">{{ formatJSON(currentDetail.params) }}</pre>
          </el-descriptions-item>
          <el-descriptions-item label="结果">
            <el-tag
              :type="currentDetail.result === 'success' ? 'success' : 'danger'"
              size="mini"
            >
              {{ currentDetail.result === 'success' ? '成功' : '失败' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作 IP">{{ currentDetail.ip }}</el-descriptions-item>
          <el-descriptions-item label="耗时">{{ currentDetail.duration }}ms</el-descriptions-item>
          <el-descriptions-item label="操作时间">{{ currentDetail.createdAt | dateTime }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import FilterBar from "@/components/filter/FilterBar.vue";
import FilterBarItem from "@/components/filter/FilterBarItem";
import dayjs from "dayjs";

const QUERY_PARAM = {
  page: 1,
  pageSize: 10,
  username: "",
  module: "",
  action: "",
  dateRange: "",
};

export default {
  name: "OperationLog",
  components: { FilterBar, FilterBarItem },
  filters: {
    dateTime(val) {
      return dayjs(val).format("YYYY-MM-DD HH:mm:ss");
    },
  },
  data() {
    return {
      tableData: [],
      total: 0,
      queryParam: { ...QUERY_PARAM },
      selectedIds: [],
      detailVisible: false,
      currentDetail: {},
    };
  },

  async created() {
    this.getList();
  },
  activated() {
    this.getList();
  },
  methods: {
    async getList() {
      const params = { ...this.queryParam };
      if (Array.isArray(params.dateRange)) {
        params.startDate = params.dateRange[0];
        params.endDate = params.dateRange[1];
      }
      delete params.dateRange;
      Object.keys(params).forEach((k) => {
        if (params[k] === "" || params[k] === null || params[k] === undefined)
          delete params[k];
        if (Array.isArray(params[k]) && !params[k].length) delete params[k];
      });
      const res = await this.$api.getLogList(params);
      this.tableData = res.list;
      this.total = res.total;
    },
    handleCurrentChange(currentPageNum) {
      this.queryParam.page = currentPageNum;
      this.getList();
    },
    handleSizeChange(size) {
      this.queryParam.pageSize = size;
      this.queryParam.page = 1;
      this.getList();
    },
    handleQuery() {
      this.queryParam.page = 1;
      this.getList();
    },
    handleReset() {
      this.queryParam = { ...QUERY_PARAM };
      this.getList();
    },
    handleSelectionChange(rows) {
      this.selectedIds = rows.map((r) => r.id);
    },
    handleDelete(ids) {
      if (!Array.isArray(ids)) ids = [ids.id];
      if (!ids.length) return;
      this.$confirm(`确定删除选中的 ${ids.length} 条日志?`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.$api.deleteLog({ ids }).then(() => {
            this.$message({ type: "success", message: "删除成功!" });
            this.selectedIds = [];
            this.getList();
          });
        })
        .catch((err) => {
          if (err === "cancel") return;
          this.$message({ type: "error", message: err });
        });
    },
    handleDetail(row) {
      this.currentDetail = row;
      this.detailVisible = true;
    },
    formatJSON(val) {
      if (!val) return "-";
      try {
        const obj = typeof val === "string" ? JSON.parse(val) : val;
        return JSON.stringify(obj, null, 2);
      } catch {
        return val;
      }
    },
  },
};
</script>

<style scoped lang="scss">
.drawer-body {
  padding: 0 20px 20px;
}
.json-block {
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  max-height: 300px;
  overflow-y: auto;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>

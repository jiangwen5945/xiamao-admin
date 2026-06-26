<template>
  <div class="page">
    <FilterBar @query="handleQuery" @reset="handleReset">
      <FilterBarItem label="模板名称">
        <el-input
          v-model="queryParam.name"
          placeholder=""
          clearable
          @keyup.enter="handleQuery"
        />
      </FilterBarItem>
      <FilterBarItem label="类型">
        <el-select v-model="queryParam.type" placeholder="全部" clearable>
          <el-option label="系统" value="system" />
          <el-option label="订单" value="order" />
          <el-option label="营销" value="marketing" />
        </el-select>
      </FilterBarItem>
      <FilterBarItem label="状态">
        <el-select v-model="queryParam.status" placeholder="全部" clearable>
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </FilterBarItem>
    </FilterBar>

    <div class="table-header">
      <div class="left">
        <el-button type="primary" size="medium" @click="handleAdd"
          >新增</el-button
        >
        <el-button
          type="danger"
          size="medium"
          :disabled="!selectedIds.length"
          @click="handleDelete(selectedIds)"
          >删除选中</el-button
        >
      </div>
    </div>

    <div class="table-content">
      <el-table
        :data="tableData"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="45" />
        <el-table-column prop="name" label="模板名称" min-width="120" />
        <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
        <el-table-column label="类型" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.type === 'system' ? '' : scope.row.type === 'order' ? 'primary' : 'warning'" size="mini">
              {{ typeMap[scope.row.type] || scope.row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="80">
          <template #default="scope">
            <el-tag
              :type="scope.row.status === 1 ? 'success' : 'danger'"
              size="mini"
            >
              {{ scope.row.status === 1 ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="scope">
            {{ scope.row.createdAt | dateTime }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button size="mini" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" size="mini" @click="handleDelete(scope.row)">删除</el-button>
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

    <el-dialog
      :title="modalType ? '编辑模板' : '新增模板'"
      :visible="isVisible"
      :before-close="handleClose"
      center
      :destroy-on-close="true"
    >
      <el-form ref="form" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="支持 {name}、{order_no} 等占位符" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            placeholder="请输入模板内容"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" placeholder="请选择类型">
            <el-option label="系统" value="system" />
            <el-option label="订单" value="order" />
            <el-option label="营销" value="marketing" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="form.status"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleClose">取 消</el-button>
        <el-button type="primary" @click="submit">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import FilterBar from "@/components/filter/FilterBar.vue";
import FilterBarItem from "@/components/filter/FilterBarItem";
import dayjs from "dayjs";

const QUERY_PARAM = {
  page: 1,
  pageSize: 10,
  name: "",
  type: "",
  status: "",
};
const createDefaultForm = () => ({
  id: "",
  name: "",
  title: "",
  content: "",
  type: "system",
  status: 1,
});

export default {
  name: "NotificationTemplateList",
  components: { FilterBar, FilterBarItem },
  filters: {
    dateTime(val) {
      return dayjs(val).format("YYYY-MM-DD HH:mm");
    },
  },
  data() {
    return {
      typeMap: { system: "系统", order: "订单", marketing: "营销" },
      tableData: [],
      total: 0,
      isVisible: false,
      modalType: 0,
      form: createDefaultForm(),
      queryParam: { ...QUERY_PARAM },
      formRules: {
        name: [
          { required: true, message: "模板名称不能为空", trigger: "blur" },
        ],
        title: [
          { required: true, message: "标题不能为空", trigger: "blur" },
        ],
        content: [
          { required: true, message: "内容不能为空", trigger: "blur" },
        ],
      },
      selectedIds: [],
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
      Object.keys(params).forEach((k) => {
        if (params[k] === "" || params[k] === null || params[k] === undefined)
          delete params[k];
        if (Array.isArray(params[k]) && !params[k].length) delete params[k];
      });
      const res = await this.$api.getNotificationTemplateList(params);
      this.tableData = res.list;
      this.total = res.total;
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
      this.queryParam = { ...QUERY_PARAM };
      this.getList();
    },
    handleSelectionChange(rows) {
      this.selectedIds = rows.map((r) => r.id);
    },
    handleDelete(ids) {
      if (!Array.isArray(ids)) ids = [ids.id];
      if (!ids.length) return;
      this.$confirm(`确定删除选中的 ${ids.length} 个模板?`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.$api.deleteNotificationTemplate({ ids }).then(() => {
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
    handleEdit(row) {
      this.isVisible = true;
      this.modalType = 1;
      this.form = JSON.parse(JSON.stringify(row));
    },
    handleAdd() {
      this.form = createDefaultForm();
      this.isVisible = true;
      this.modalType = 0;
    },
    async submit() {
      await this.$refs.form.validate();
      const payload = { ...this.form };
      delete payload.createdAt;
      delete payload.updatedAt;
      if (this.modalType === 0) delete payload.id;
      await (this.modalType === 0
        ? this.$api.addNotificationTemplate(payload)
        : this.$api.updateNotificationTemplate(payload));
      this.getList();
      this.handleClose();
      this.$message({
        type: "success",
        message: this.modalType === 0 ? "添加成功" : "编辑成功",
      });
    },
    handleClose() {
      this.form = createDefaultForm();
      this.isVisible = false;
      this.$refs.form.clearValidate();
    },
  },
};
</script>

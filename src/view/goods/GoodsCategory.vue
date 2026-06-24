<template>
  <div class="page">
    <!-- 表格头部：新增按钮 -->
    <div class="table-header">
      <div class="left">
        <el-button type="primary" size="medium" @click="handleAdd">
          新增分类
        </el-button>
      </div>
    </div>

    <!-- 分类列表 -->
    <div class="table-content">
      <el-table :data="tableData" stripe ref="refTable">
        <!-- <el-table-column prop="sort" label="排序"></el-table-column> -->
        <el-table-column prop="id" label="ID"></el-table-column>
        <el-table-column prop="name" label="分类名称">
          <template #default="scope">
            <el-link
              type="primary"
              :underline="false"
              @click="handleSub(scope.row)"
            >
              {{ scope.row.name }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160">
          <template #default="scope">
            <el-button size="mini" @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button
              type="danger"
              size="mini"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页器 -->
      <el-pagination
        layout="prev, pager, next"
        :total="total"
        :page-size="queryParam.pageSize"
        :current-page.sync="queryParam.page"
        class="pagination"
        @current-change="handleCurrentChange"
      >
      </el-pagination>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      :title="modalType ? '修改商品分类' : '新增商品分类'"
      :visible="isVisible"
      :before-close="handleClose"
      center
      width="40%"
      :destroy-on-close="true"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称"></el-input>
        </el-form-item>

        <el-form-item label="排序权重" prop="sort">
          <el-input v-model.number="form.sort" placeholder="请输入排序权重"></el-input>
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

import rules from "@/utils/rules";

const QUERY_PARAM = { page: 1, pageSize: 10, name: '' }
const createDefaultForm = () => ({ id: null, name: null, sort: null })

export default {
  name: "GoodsCategory",
  data() {
    return {
      // 表格数据
      tableData: [],
      // 数据总数
      total: 0,
      // 弹窗显示状态
      isVisible: false,
      // 0-新增 1-编辑
      modalType: 0,
      // 查询参数
      queryParam: { ...QUERY_PARAM }, // 数据只有一层可以用浅拷贝
      form: createDefaultForm(),
      // 表单校验规则
      rules,
    };
  },

  created() {
    this.getList();
  },
  activated() {
    this.getList();
  },
  methods: {
    // 获取分类列表
    async getList() {
      const res = await this.$api.getGoodsCategory(this.queryParam);
      this.tableData = res.list;
      this.total = res.total;
    },
    // 切换页码
    handleCurrentChange(currentPageNum) {
      this.queryParam.page = currentPageNum;
      this.getList();
    },
    // 删除（带确认提示）
    handleDelete(row) {
      this.$confirm("确定删除?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.$api.deleteGoodsCategory(row).then(() => {
            this.$message({ type: "success", message: "删除成功!" });
            this.getList();
          });
        })
        .catch((err) => {
          if (err === "cancel") return;
          this.$message({ type: "error", message: err });
        });
    },
    // 编辑：回填数据
    handleEdit(row) {
      this.isVisible = true;
      this.modalType = 1;
      this.form = JSON.parse(JSON.stringify(row));
    },
    // 新增：打开空白表单
    handleAdd() {
      this.form = createDefaultForm()
      this.isVisible = true;
      this.modalType = 0;
    },
    // 提交表单
    async submit() {
      await this.$refs.form.validate();
      if (this.modalType === 0) {
        await this.$api.createGoodsCategory(this.form);
        this.getList();
      } else {
        await this.$api.updateGoodsCategory(this.form);
        this.getList();
      }
      this.handleClose();
      this.$message({
        type: "success",
        message: this.modalType === 0 ? "添加成功" : "编辑成功",
      });
    },
    // 关闭弹窗
    handleClose() {
      this.form = createDefaultForm()
      this.isVisible = false;
      this.$refs.form.clearValidate();
    },
    // 点击分类名称跳转至商品列表
    handleSub(row) {
      this.$router.push({ path: "/goods/list", query: { category_id: row.id } });
    },
  },
};
</script>

<style scoped lang="scss"></style>

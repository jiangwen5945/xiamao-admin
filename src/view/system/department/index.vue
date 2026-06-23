<template>
  <div class="page">
    <!-- 头部 -->
    <div class="table-header">
      <div class="left">
        <el-button type="primary" size="medium" @click="handleAdd">新增</el-button>
      </div>
    </div>

    <!-- 表格内容 -->
    <div class="table-content">
      <el-table 
        :data="tableData" 
        stripe 
        :default-sort="{prop:'classId', order:'descending'}"
      >
        <el-table-column prop="id" label="ID" />
        <el-table-column prop="name" label="部门名称" />
        <el-table-column prop="userCount" label="人员数量" />
        <!-- 操作 -->
        <el-table-column label="操作">
          <template slot-scope="scope">
            <el-button size="mini" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" size="mini" @click="handleDelete({ classId: scope.row.classId})">删除</el-button>
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

    <!-- 弹出层 -->
    <el-dialog :title="modalType ? '修改部门':'新增部门'" :visible.sync="isVisible" :before-close="handleClose"  center width="30%"  :destroy-on-close="true">
      <el-form ref="form" :model="form" :rules="rules"  label-width="80px">
        <el-form-item label="部门名称"  prop="className">
          <el-input v-model="form.className" autocomplete="off" placeholder="请输入部门名称"></el-input>
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
import rules from '@/utils/rules';
export default {
  name: 'DepartmentList',
  data() {
    return {
      rules,
      tableData: [],
      total: 0,
      isVisible: false,
      modalType: 0,
      queryParam: {
        page: 1,
        limit: 10
      },
      form:{
        classId:'',
        className:'',
        employeesCount: ''
      },
      initForm: null
    };
  },
  created() {
    this.getData()
    this.initForm = JSON.parse(JSON.stringify(this.form))
  },
  activated() {
    this.getData()
  },
  methods: {
    async getData() {
      const { list, total } = await this.$api.getClassList(this.queryParam)
      this.tableData = list
      this.total = total
    },
    handleDelete(id) {
      this.$confirm('确定删除?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$api.deleteClass(id).then(() => {
          this.$message({
            type: 'success',
            message: '删除成功!'
          });
          this.getData()
        })
      }).catch(err => {
        if (err === 'cancel') return
        this.$message({
          type: 'error',
          message: err
        });
      });
    },
    handleEdit(row) {
      this.isVisible = true
      this.modalType = 1
      this.form = JSON.parse(JSON.stringify(row))
    },
    handleAdd() {
      this.isVisible = true
      this.modalType = 0
    },
    submit() {
      this.$refs.form.validate( async valid => {
        if (valid) {
          switch (this.modalType) {
            case 0:
              await this.$api.createClass(this.form)
              this.getData()
              break;
            case 1:
              await this.$api.updateClass(this.form)
              this.getData()
              break;
          }
          this.handleClose()
          this.$message({
            type: 'success',
            message: this.modalType === 0 ? '添加成功' : '编辑成功'
          });
        }
      })
    },
    handleClose() {
      this.form = { ...this.initForm }
      this.isVisible = false
      this.$refs.form.clearValidate()
    },
    // 切换页码
    handleCurrentChange(currentPageNum) {
      this.queryParam.page = currentPageNum;
      this.getData();
    },
  }
}
</script>
 
<style scoped lang="scss"></style>
 
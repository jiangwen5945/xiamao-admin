<template>
  <div class="page">
    <!-- 表格头部 -->
    <div class="table-header">
      <div class="left">
        <el-button type="primary" size="medium" @click="handleAdd"
          >新增</el-button
        >
        <CommonExcel
          :tableData="tableData"
          :loading.sync="loading"
        ></CommonExcel>
      </div>
      <div class="right">
        <el-input
          placeholder="请输入用户名称"
          v-model="queryParam.username"
          :readonly="readonlyInput"
          @focus="cancelReadOnly()"
        ></el-input>
        <el-button
          type="primary"
          size="medium"
          @click="handleQuery"
          style="margin-left: 10px"
          >查询</el-button
        >
      </div>
    </div>

    <!-- 表格内容 -->
    <div class="table-content">
      <!-- 数据表格 -->
      <el-table :data="tableData" stripe ref="refTable">
        <el-table-column prop="username" label="姓名"> </el-table-column>
        <el-table-column prop="nickname" label="昵称"> </el-table-column>
        <el-table-column prop="email" label="邮箱" width="200"> </el-table-column>
        <el-table-column prop="phone" label="手机"> </el-table-column>
        <el-table-column prop="gender" label="性别">
          <template slot-scope="scope">
            <span>{{ scope.row.gender == 1 ? "男" : "女" }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态"> </el-table-column>
        <el-table-column prop="roles" label="角色">
          <template #default="scope">
            <el-button
              type="text"
              size="mini"
              v-for="item in typeof scope.row.roles === 'string'
                ? scope.row.roles.split(',')
                : scope.row.roles"
              :key="item.index"
            >
              {{ item }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="birth" label="出生日期" width="150">
        </el-table-column>
        <el-table-column prop="created_at" label="创建日期" width="180">
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template slot-scope="scope">
            <el-button size="mini" @click="handleEdit(scope.row)"
              >编辑</el-button
            >
            <el-button
              type="danger"
              size="mini"
              @click="handleDelete(scope.row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页 -->
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
    <el-dialog
      :title="modalType ? '修改用户' : '新增用户'"
      :visible="isVisible"
      :before-close="handleClose"
      center
      :destroy-on-close="true"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="姓名" prop="username">
          <el-input v-model="form.username" placeholder="请输入姓名"></el-input>
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            placeholder="请输入密码"
            type="password"
            show-password
          ></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱"></el-input>
        </el-form-item>
        <el-form-item label="手机" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号"></el-input>
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select
            v-model="form.gender"
            placeholder="请选择性别"
            style="width: 100%"
          >
            <el-option label="男" value="1"></el-option>
            <el-option label="女" value="0"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="form.status"
            placeholder="请选择状态"
            style="width: 100%"
          >
            <el-option label="启用" :value="1"></el-option>
            <el-option label="禁用" :value="0"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="角色" prop="roles">
          <el-checkbox-group v-model="form.roles">
            <el-checkbox
              v-for="item in roleList"
              :label="item.name"
              :key="item.id"
            >{{ item.title }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="出生日期" prop="birth">
          <el-date-picker
            type="date"
            placeholder="选择日期"
            v-model="form.birth"
            value-format="yyyy-MM-dd"
            style="width: 100%"
          ></el-date-picker>
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
import { getUser, addUser, editUser, delUser, getRolesList } from "../api";
import rules from "../utils/rules";
import CommonExcel from "@/components/CommonExcel.vue";
export default {
  name: "UserManage",
  components: {
    CommonExcel,
  },
  data() {
    return {
      tableData: [],
      total: 0,
      isVisible: false,
      modalType: 0,
      initForm: null,
      roleList: [],
      form: {
        username: "",
        nickname: "",
        password: "",
        email: "",
        phone: "",
        gender: "",
        status: "",
        roles: [],
        birth: "",
      },
      queryParam: {
        page: 1,
        pageSize: 10,
        username: "",
      },
      rules,
      loading: false,
      readonlyInput: true,
    };
  },
  async created() {
    this.getData();
    this.initForm = { ...this.form };
    const res = await getRolesList()
    this.roleList = res
  },
  activated() {
    this.getData();
  },
  methods: {
    async getData() {
      const res = await this.getDataApi();
      this.tableData = res.list;
      this.total = res.total;
    },
    getDataApi() {
      return getUser(this.queryParam);
    },
    deleteApi(id) {
      return delUser(id);
    },
    async createApi(data) {
      return await addUser(data);
    },
    updateApi(data) {
      return editUser(data);
    },
    handleCurrentChange(currentPageNum) {
      this.queryParam.page = currentPageNum;
      this.getData();
    },
    handleQuery() {
      this.queryParam.page = 1;
      this.getData();
    },
    cancelReadOnly() {
      this.readonlyInput = false;
    },
    handleDelete(id) {
      this.$confirm("确定删除?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.deleteApi(id).then(() => {
            this.$message({
              type: "success",
              message: "删除成功!",
            });
            this.getData();
          });
        })
        .catch((err) => {
          if (err === "cancel") return;
          this.$message({
            type: "error",
            message: err,
          });
        });
    },
    handleEdit(row) {
      this.isVisible = true;
      this.modalType = 1;
      this.form = JSON.parse(JSON.stringify(row));
      if (typeof this.form.roles === 'string') {
        this.form.roles =  this.form.roles.split(',')
      }
    },
    handleAdd() {
      this.isVisible = true;
      this.modalType = 0;
    },
    async submit() {
      const params = {
        ...this.form,
        roles: Array.isArray(this.form.roles)
          ? this.form.roles.join(",")
          : this.form.roles,
      };
      let flag = false;
      await this.$refs.form.validate();
      // 添加操作
      if (this.modalType === 0) {
        await this.createApi(params);
        this.getData();
        flag = true;
        // 更新操作
      } else {
        await this.updateApi(params);
        this.getData();
        flag = true;
      }
      if (flag) {
        this.handleClose();
        this.$message({
          type: "success",
          message: this.modalType === 0 ? "添加成功" : "编辑成功",
        });
      }
    },
    handleClose() {
      this.form = { ...this.initForm };
      this.isVisible = false;
      this.$refs.form.clearValidate();
    },
  }
};
</script>

<style scoped lang="scss"></style>

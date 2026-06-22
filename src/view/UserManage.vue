<template>
  <div class="page">
    <!-- 表格头部：新增按钮、导出、搜索 -->
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
          v-model="queryParam.username"
          placeholder="请输入用户名称"
          clearable
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

    <!-- 用户列表表格 -->
    <div class="table-content">
      <el-table :data="tableData" stripe ref="refTable">
        <el-table-column
          prop="username"
          label="用户名"
          width="150"
          fixed="left"
        >
        </el-table-column>
        <el-table-column prop="avatar" label="头像">
          <template slot-scope="scope">
            <img class="avatar" :src="scope.row.avatar" />
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称"> </el-table-column>
        <el-table-column prop="email" label="邮箱" width="200">
        </el-table-column>
        <el-table-column prop="phone" label="手机" width="150">
        </el-table-column>
        <el-table-column prop="gender" label="性别">
          <template slot-scope="scope">
            <span>{{ scope.row.gender == 1 ? "男" : "女" }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态"> </el-table-column>
        <!-- 角色标签展示 -->
        <el-table-column prop="Roles" label="角色" width="150">
          <template #default="scope">
            <el-tag
              v-for="item in scope.row.Roles"
              :key="item.id"
              size="mini"
              style="margin-right: 4px"
            >
              {{ item.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="birth" label="出生日期" width="150">
        </el-table-column>
        <!-- 操作列：编辑 / 删除 -->
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

    <!-- 新增/编辑 用户弹窗 -->
    <el-dialog
      :title="modalType ? '修改用户' : '新增用户'"
      :visible="isVisible"
      :before-close="handleClose"
      center
      :destroy-on-close="true"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <!-- 头像上传 -->
        <el-form-item label="头像" prop="avatar">
          <el-upload
            class="avatar-uploader"
            action="/api/uploadFiles"
            :http-request="handleUploadFile"
            :show-file-list="false"
            :before-upload="beforeAvatarUpload"
            accept=".png, .jepg, .jpg, .webp"
          >
            <img
              v-if="form.avatar"
              :src="form.avatar"
              class="avatar-uploader-img"
            />
            <i v-else class="el-icon-plus avatar-uploader-icon"></i>
          </el-upload>
        </el-form-item>
        <el-form-item label="姓名" prop="username">
          <el-input v-model="form.username" placeholder="请输入姓名"></el-input>
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称"></el-input>
        </el-form-item>
        <!-- 密码：编辑时留空则不修改 -->
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            :placeholder="modalType ? '留空则不修改' : '请输入密码'"
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
        <!-- 角色多选 -->
         {{ this.roleList }}
        <el-form-item label="角色" prop="roles" v-if="form.roles">
          <el-checkbox-group v-model="form.roles">
            <el-checkbox
              v-for="item in roleList"
              :label="item.id"
              :key="item.id"
              >{{ item.name }}</el-checkbox
            >
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
import {
  getUser,
  addUser,
  editUser,
  delUser,
  getRoleList,
  uploadFiles,
} from "../api";
import rules from "../utils/rules";
import CommonExcel from "@/components/CommonExcel.vue";
import { useCloned } from "@vueuse/core";

export default {
  name: "UserManage",
  components: {
    CommonExcel,
  },
  data() {
    return {
      tableData: [], // 表格数据
      total: 0, // 数据总数
      isVisible: false, // 弹窗显示状态
      modalType: 0, // 0-新增 1-编辑
      roleList: [], // 角色列表
      form: {}, // 表单数据
      queryParam: {
        // 查询参数
        page: 1,
        pageSize: 10,
        username: "",
      },
      rules, // 表单校验规则
      loading: false, // 导出加载状态
    };
  },
  async created() {
    this.getUserList();
    const { list } = await getRoleList();
    this.roleList = list
  },
  activated() {
    this.getUserList();
  },
  methods: {
    // 上传头像图片
    async handleUploadFile({ file }) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("directory", "avatar") // 指定上传图片存放位置的分类目录
      const res = await uploadFiles(formData);
      console.log("上传头像图片", res);
      this.$set(this.form, "avatar", res.url);
    },
    // 获取用户列表
    async getUserList() {
      const res = await getUser(this.queryParam);
      this.tableData = res.list;
      this.total = res.total;
    },
    // 切换页码
    handleCurrentChange(currentPageNum) {
      this.queryParam.page = currentPageNum;
      this.getUserList();
    },
    // 按名称搜索（回到第一页）
    handleQuery() {
      this.queryParam.page = 1;
      this.getUserList();
    },
    // 删除用户（带确认提示）
    handleDelete(id) {
      this.$confirm("确定删除?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          delUser(id).then(() => {
            this.$message({
              type: "success",
              message: "删除成功!",
            });
            this.getUserList();
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
    // 编辑：回填数据
    handleEdit(row) {
      this.isVisible = true;
      this.modalType = 1;
      const { cloned } = useCloned(row);
      this.form = cloned;
      // 后端返回的 Roles 是对象数组，提取 id 转成 checkox 所需的数组
      const ids = Array.isArray(this.form.Roles)
        ? this.form.Roles.map((item) => item.id)
        : [];
      this.$set(this.form, "roles", ids);
      this.form.password = "";
      // 编辑时密码非必填
      this.rules.password = this.rules.password.filter((r) => !r.required);
    },
    // 新增：打开空白表单
    handleAdd() {
      this.isVisible = true;
      this.modalType = 0;
      this.$set(this.form, "roles", []);
    },
    // 提交表单
    async submit() {
      const params = {
        ...this.form,
        roles: this.form.roles.join(","),
      };
      // 编辑时密码为空则不修改，新增时密码为空则使用默认值
      if (!params.password) {
        if (this.modalType === 1) {
          delete params.password;
        } else {
          params.password = "123456";
        }
      }
      let flag = false;
      await this.$refs.form.validate();
      if (this.modalType === 0) {
        await addUser(params);
        this.getUserList();
        flag = true;
      } else {
        await editUser(params);
        this.getUserList();
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
    // 关闭弹窗
    handleClose() {
      this.isVisible = false;
      this.$refs.form.clearValidate();
      this.form = {};
    },
    // 头像上传前校验（限制 2MB）
    beforeAvatarUpload(file) {
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        this.$message.error("上传头像图片大小不能超过 2MB!");
      }
      return isLt2M;
    },
  },
};
</script>

<style scoped lang="scss">
.avatar {
  width: 20px;
  height: 20px;
}

.avatar-uploader {
  width: 70px;
  height: 70px;
  .avatar-uploader-icon {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    width: 70px;
    height: 70px;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  .avatar-uploader-img {
    display: block;
    width: 70px;
    height: 70px;
  }
}
</style>

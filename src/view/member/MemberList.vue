<template>
  <div class="page">

    <!-- 筛选栏 -->
    <FilterBar @query="handleQuery" @reset="handleReset">
      <FilterBarItem label="昵称">
        <el-input v-model="queryParam.nickname" placeholder="" clearable @keyup.enter="handleQuery" />
      </FilterBarItem>
      <FilterBarItem label="手机号">
        <el-input v-model="queryParam.phone" placeholder="" clearable @keyup.enter="handleQuery" />
      </FilterBarItem>
      <FilterBarItem label="状态">
        <el-select v-model="queryParam.status" placeholder="全部" clearable>
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </FilterBarItem>
    </FilterBar>

    <!-- 操作栏 -->
    <div class="table-header">
      <div class="left">
        <el-button type="primary" size="medium" @click="handleAdd">新增</el-button>
        <el-button type="danger" size="medium" :disabled="!selectedIds.length" @click="handleDelete(selectedIds)">删除选中</el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-content">
      <el-table :data="tableData" stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="45" />
        <el-table-column label="头像" width="70">
          <template #default="scope">
            <el-image
              :src="scope.row.avatar"
              style="width:40px;height:40px;object-fit:cover;border-radius:50%"
              fit="cover"
            />
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" min-width="120">
          <template #default="scope">
            <el-link type="primary" :underline="false" @click="handleDetail(scope.row)">
              {{ scope.row.nickname }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="open_id" label="微信 openID" min-width="200">
          <template #default="scope">
            <span style="font-family:monospace;font-size:13px">{{ scope.row.open_id }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="mini">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="220" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button size="mini" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" size="mini" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页 -->
      <el-pagination
        layout="total, prev, pager, next"
        :total="total"
        :page-size="queryParam.limit"
        :current-page.sync="queryParam.page"
        class="pagination"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      :title="modalType ? '修改会员' : '新增会员'"
      :visible="isVisible"
      :before-close="handleClose"
      center
      :destroy-on-close="true"
    >
      <el-form ref="form" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="头像" prop="avatar">
          <el-upload
            class="avatar-uploader"
            action="/api/uploadFiles"
            :http-request="handleUploadFile"
            :show-file-list="false"
            :before-upload="beforeAvatarUpload"
            accept=".png, .jepg, .jpg, .webp"
          >
            <img v-if="form.avatar" :src="form.avatar" class="avatar-uploader-img" />
            <i v-else class="el-icon-plus avatar-uploader-icon"></i>
          </el-upload>
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
        
        <el-form-item label="微信 openID">
          <el-input v-model="form.open_id" placeholder="请输入微信 openID" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleClose">取 消</el-button>
        <el-button type="primary" @click="submit">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      :visible.sync="detailVisible"
      title="会员详情"
      size="520px"
      :destroy-on-close="true"
    >
      <div class="drawer-body" v-if="currentDetail.id">
        <div class="detail-avatar">
          <el-image :src="currentDetail.avatar" style="width:80px;height:80px;border-radius:50%;object-fit:cover" fit="cover" />
        </div>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="昵称">{{ currentDetail.nickname }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentDetail.phone }}</el-descriptions-item>
          <el-descriptions-item label="微信 openID">{{ currentDetail.open_id }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentDetail.status === 1 ? 'success' : 'danger'" size="mini">
              {{ currentDetail.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentDetail.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ currentDetail.updatedAt }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>
  </div>
</template>

<script>
// 导入公共组件
import FilterBar from "../../components/FilterBar.vue";
import FilterBarItem from "../../components/FilterBarItem.vue";
// 导入 API


export default {
  name: "MemberList",
  components: { FilterBar, FilterBarItem },
  data() {
    return {
      tableData: [],         // 表格数据
      total: 0,              // 数据总数
      isVisible: false,      // 弹窗显隐
      modalType: 0,          // 0-新增 1-编辑
      form: {
        id: "",
        nickname: "",
        phone: "",
        avatar: "",
        open_id: "",
        status: 1,
      },
      // 查询参数
      queryParam: {
        page: 1,
        limit: 10,
        nickname: "",
        phone: "",
        status: "",
      },
      // 表单校验规则
      formRules: {
        nickname: [{ required: true, message: "昵称不能为空", trigger: "blur" }],
        phone: [
          { required: true, message: "手机号不能为空", trigger: "blur" },
          { pattern: /^1\d{10}$/, message: "手机号格式不正确", trigger: "blur" },
        ],
      },

      selectedIds: [],       // 选中行的 ID 列表
      detailVisible: false,  // 详情抽屉显隐
      currentDetail: {},     // 当前查看的会员详情
    };
  },

  async created() {
    // 保存表单默认值，用于重置
    this.defaultForm = JSON.parse(JSON.stringify(this.form));
    this.getList();
  },
  activated() {
    // keep-alive 激活时刷新
    this.getList();
  },
  methods: {
    // 获取会员列表
    async getList() {
      const params = { ...this.queryParam }
      // 剔除空参数
      Object.keys(params).forEach(k => {
        if (params[k] === '' || params[k] === null || params[k] === undefined) delete params[k]
        if (Array.isArray(params[k]) && !params[k].length) delete params[k]
      })
      const res = await this.$api.getMemberList(params);
      this.tableData = res.list;
      this.total = res.total;
    },
    // 切换页码
    handleCurrentChange(currentPageNum) {
      this.queryParam.page = currentPageNum;
      this.getList();
    },
    // 查询
    handleQuery() {
      this.queryParam.page = 1;
      this.getList();
    },
    // 重置筛选条件
    handleReset() {
      this.queryParam = {
        page: 1,
        limit: 10,
        nickname: "",
        phone: "",
        status: "",
      }
      this.getList();
    },
    // 多选切换
    handleSelectionChange(rows) {
      this.selectedIds = rows.map(r => r.id)
    },
    // 删除（支持单个或批量）
    handleDelete(ids) {
      if (!Array.isArray(ids)) ids = [ids.id]
      if (!ids.length) return
      this.$confirm(`确定删除选中的 ${ids.length} 个会员?`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.$api.deleteMember({ ids }).then(() => {
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
    // 查看详情
    handleDetail(row) {
      this.currentDetail = row
      this.detailVisible = true
    },
    // 编辑
    handleEdit(row) {
      this.isVisible = true;
      this.modalType = 1;
      this.form = JSON.parse(JSON.stringify(row));
    },
    // 新增
    handleAdd() {
      this.isVisible = true;
      this.modalType = 0;
    },
    // 提交表单
    async submit() {
      await this.$refs.form.validate();
      const payload = { ...this.form };
      if (this.modalType === 0) {
        // 新增
        delete payload.id;
        delete payload.createdAt;
        delete payload.updatedAt;
        await this.$api.createMember(payload);
        this.getList();
      } else {
        // 编辑
        delete payload.createdAt;
        delete payload.updatedAt;
        await this.$api.updateMember(payload);
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
      this.form = JSON.parse(JSON.stringify(this.defaultForm));
      this.isVisible = false;
      this.$refs.form.clearValidate();
    },
    // 上传头像
    async handleUploadFile({ file }) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("directory", "avatar");
      const res = await this.$api.uploadFiles(formData);
      this.$set(this.form, "avatar", res.url);
    },
    // 头像上传前校验
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
.drawer-body {
  padding: 0 20px 20px;
}
.detail-avatar {
  text-align: center;
  margin-bottom: 20px;
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

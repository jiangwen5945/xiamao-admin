<template>
  <div class="page">
    <!-- 筛选栏 -->
    <FilterBar @query="handleQuery" @reset="handleReset">
      <FilterBarItem label="昵称">
        <el-input
          v-model="queryParam.nickname"
          placeholder=""
          clearable
          @keyup.enter="handleQuery"
        />
      </FilterBarItem>
      <FilterBarItem label="手机号">
        <el-input
          v-model="queryParam.phone"
          placeholder=""
          clearable
          @keyup.enter="handleQuery"
        />
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
        <CommonExcel :table-data="tableData" :columns="exportColumns" filename="会员列表" />
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-content">
      <el-table
        ref="refTable"
        :data="tableData"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="45" />
        <el-table-column label="头像" width="70">
          <template #default="scope">
            <el-image
              :src="scope.row.avatar"
              style="
                width: 40px;
                height: 40px;
                object-fit: cover;
                border-radius: 50%;
              "
              fit="cover"
            />
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" width="100">
          <template #default="scope">
            <el-link
              type="primary"
              :underline="false"
              @click="handleDetail(scope.row)"
            >
              {{ scope.row.nickname }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" />

        <el-table-column label="状态">
          <template #default="scope">
            <el-tag
              :type="scope.row.status === 1 ? 'success' : 'danger'"
              size="mini"
            >
              {{ scope.row.status === 1 ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="等级">
          <template #default="scope">
            <span
              class="level-badge"
              :style="levelBadgeStyle[scope.row.level] || {}"
            >
              {{ levelMap[scope.row.level] || scope.row.level }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间">
          <template #default="scope">
            {{ scope.row.createdAt | dateTime }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
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
        layout="total, prev, pager, next"
        :total="total"
        :page-size="queryParam.pageSize"
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
            <img
              v-if="form.avatar"
              :src="form.avatar"
              class="avatar-uploader-img"
            />
            <i v-else class="el-icon-plus avatar-uploader-icon"></i>
          </el-upload>
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="form.phone"
            placeholder="请输入手机号"
            maxlength="11"
          />
        </el-form-item>

        <el-form-item label="等级">
          <el-select v-model="form.level" placeholder="请选择等级">
            <el-option
              v-for="(label, val) in levelMap"
              :key="val"
              :label="label"
              :value="Number(val)"
            />
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

    <!-- 详情抽屉 -->
    <el-drawer
      :visible.sync="detailVisible"
      title="会员详情"
      size="600px"
      :destroy-on-close="true"
    >
      <div class="drawer-body" v-if="currentDetail.id">
        <div class="detail-avatar">
          <el-image
            :src="currentDetail.avatar"
            style="
              width: 80px;
              height: 80px;
              border-radius: 50%;
              object-fit: cover;
            "
            fit="cover"
          />
        </div>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="昵称">{{
            currentDetail.nickname
          }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{
            currentDetail.phone
          }}</el-descriptions-item>
          <el-descriptions-item label="等级">
            <span
              class="level-badge"
              :style="levelBadgeStyle[currentDetail.level] || {}"
            >
              {{ levelMap[currentDetail.level] || currentDetail.level }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag
              :type="currentDetail.status === 1 ? 'success' : 'danger'"
              size="mini"
            >
              {{ currentDetail.status === 1 ? "启用" : "禁用" }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{
            currentDetail.createdAt | dateTime
          }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{
            currentDetail.updatedAt | dateTime
          }}</el-descriptions-item>
        </el-descriptions>

        <!-- 收货地址 -->
        <div class="address-section">
          <div class="section-header">
            <span class="section-title">收货地址</span>
            <el-button size="mini" type="primary" @click="handleAddressAdd">新增地址</el-button>
          </div>
          <el-table :data="addressList" stripe size="small" v-loading="addressLoading">
            <el-table-column label="收货人" prop="name" width="80" />
            <el-table-column label="电话" prop="phone" width="120" />
            <el-table-column label="地址" min-width="160">
              <template #default="scope">
                {{ [scope.row.province, scope.row.city, scope.row.district, scope.row.detail].filter(Boolean).join(' ') }}
              </template>
            </el-table-column>
            <el-table-column label="操作"             width="100" fixed="right">
              <template #default="scope">
                <el-button type="text" size="mini" @click="handleAddressEdit(scope.row)">编辑</el-button>
                <el-button type="text" size="mini" style="color:#f56c6c" @click="handleAddressDelete(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="!addressList.length && !addressLoading" class="address-empty">
            暂无收货地址
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 地址新增/编辑弹窗 -->
    <el-dialog
      :title="addressModalType ? '编辑地址' : '新增地址'"
      :visible="addressVisible"
      :before-close="handleAddressClose"
      width="480px"
      :destroy-on-close="true"
    >
      <el-form ref="addressForm" :model="addressForm" :rules="addressRules" label-width="80px">
        <el-form-item label="收货人" prop="name">
          <el-input v-model="addressForm.name" placeholder="请输入收货人" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="addressForm.phone" placeholder="请输入电话" maxlength="11" />
        </el-form-item>
        <el-form-item label="省份" prop="province">
          <el-input v-model="addressForm.province" placeholder="请输入省份" />
        </el-form-item>
        <el-form-item label="城市" prop="city">
          <el-input v-model="addressForm.city" placeholder="请输入城市" />
        </el-form-item>
        <el-form-item label="区县" prop="district">
          <el-input v-model="addressForm.district" placeholder="请输入区县" />
        </el-form-item>
        <el-form-item label="详细地址" prop="detail">
          <el-input v-model="addressForm.detail" placeholder="请输入街道/门牌号" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleAddressClose">取 消</el-button>
        <el-button type="primary" @click="submitAddress">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import FilterBar from "@/components/filter/FilterBar.vue";
import FilterBarItem from "@/components/filter/FilterBarItem";
import CommonExcel from "@/components/CommonExcel.vue";
import dayjs from "dayjs";

const QUERY_PARAM = {
  page: 1,
  pageSize: 10,
  nickname: "",
  phone: "",
  status: "",
};
const createDefaultForm = () => ({
  id: "",
  nickname: "",
  phone: "",
  avatar: "",
  level: 1,
  status: 1,
});
const createDefaultAddressForm = () => ({
  id: "",
  member_id: "",
  name: "",
  phone: "",
  province: "",
  city: "",
  district: "",
  detail: "",
});

export default {
  name: "MemberList",
  components: { FilterBar, FilterBarItem, CommonExcel },
  filters: {
    dateTime(val) {
      return dayjs(val).format("YYYY-MM-DD HH:mm");
    },
  },
  data() {
    return {
      levelMap: { 1: "普通会员", 2: "银卡会员", 3: "金卡会员", 4: "钻石会员" },
      levelBadgeStyle: {
        1: { background: "#b2deff", color: "#fff" },
        2: { background: "#e8eaf6", color: "#3f51b5" },
        3: { background: "#fff3e0", color: "#e65100" },
        4: { background: "#e0f7fa", color: "#0dbac1" },
      },
      tableData: [],
      total: 0,
      isVisible: false,
      modalType: 0,
      form: createDefaultForm(),
      queryParam: { ...QUERY_PARAM },
      formRules: {
        nickname: [
          { required: true, message: "昵称不能为空", trigger: "blur" },
        ],
        phone: [
          { required: true, message: "手机号不能为空", trigger: "blur" },
          {
            pattern: /^1\d{10}$/,
            message: "手机号格式不正确",
            trigger: "blur",
          },
        ],
      },
      selectedIds: [],
      detailVisible: false,
      currentDetail: {},
      // 地址管理
      addressList: [],
      addressLoading: false,
      addressVisible: false,
      addressModalType: 0,
      addressForm: createDefaultAddressForm(),
      addressRules: {
        name: [{ required: true, message: '收货人不能为空', trigger: 'blur' }],
        phone: [
          { required: true, message: '电话不能为空', trigger: 'blur' },
          { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' },
        ],
      },
    };
  },
  computed: {
    exportColumns() {
      return [
        { label: '昵称', prop: 'nickname' },
        { label: '手机号', prop: 'phone' },
        { label: '状态', formatter: (row) => row.status === 1 ? '启用' : '禁用' },
        { label: '等级', formatter: (row) => this.levelMap[row.level] || row.level },
        { label: '创建时间', formatter: (row) => row.createdAt ? dayjs(row.createdAt).format('YYYY-MM-DD HH:mm') : '' },
      ]
    },
  },
  async created() {
    this.getList();
  },
  activated() {
    // keep-alive 激活时刷新
    this.getList();
  },
  methods: {
    // 获取会员列表
    async getList() {
      const params = { ...this.queryParam };
      // 剔除空参数
      Object.keys(params).forEach((k) => {
        if (params[k] === "" || params[k] === null || params[k] === undefined)
          delete params[k];
        if (Array.isArray(params[k]) && !params[k].length) delete params[k];
      });
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
      this.queryParam = { ...QUERY_PARAM };
      this.getList();
    },
    // 多选切换
    handleSelectionChange(rows) {
      this.selectedIds = rows.map((r) => r.id);
    },
    // 删除（支持单个或批量）
    handleDelete(ids) {
      if (!Array.isArray(ids)) ids = [ids.id];
      if (!ids.length) return;
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
      this.currentDetail = row;
      this.detailVisible = true;
      this.loadAddressList(row.id);
    },
    // 加载地址列表
    async loadAddressList(memberId) {
      this.addressLoading = true;
      try {
        const res = await this.$api.getAddressList({ member_id: memberId });
        this.addressList = res.list || [];
      } catch {
        this.addressList = [];
      } finally {
        this.addressLoading = false;
      }
    },
    // 新增地址
    handleAddressAdd() {
      this.addressForm = createDefaultAddressForm();
      this.addressForm.member_id = this.currentDetail.id;
      this.addressModalType = 0;
      this.addressVisible = true;
    },
    // 编辑地址
    handleAddressEdit(row) {
      this.addressForm = JSON.parse(JSON.stringify(row));
      this.addressModalType = 1;
      this.addressVisible = true;
    },
    // 删除地址
    handleAddressDelete(row) {
      this.$confirm('确定删除该地址?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          this.$api.deleteAddress({ id: row.id }).then(() => {
            this.$message({ type: 'success', message: '删除成功' });
            this.loadAddressList(this.currentDetail.id);
          });
        })
        .catch(() => {});
    },
    // 提交地址表单
    async submitAddress() {
      await this.$refs.addressForm.validate();
      const payload = { ...this.addressForm };
      delete payload.createdAt;
      delete payload.updatedAt;
      if (this.addressModalType === 0) {
        delete payload.id;
        await this.$api.addAddress(payload);
      } else {
        await this.$api.updateAddress(payload);
      }
      this.$message({ type: 'success', message: '保存成功' });
      this.handleAddressClose();
      this.loadAddressList(this.currentDetail.id);
    },
    // 关闭地址弹窗
    handleAddressClose() {
      this.addressForm = createDefaultAddressForm();
      this.addressVisible = false;
    },
    // 编辑
    handleEdit(row) {
      this.isVisible = true;
      this.modalType = 1;
      this.form = JSON.parse(JSON.stringify(row));
    },
    // 新增
    handleAdd() {
      this.form = createDefaultForm();
      this.isVisible = true;
      this.modalType = 0;
    },
    // 提交表单
    async submit() {
      await this.$refs.form.validate();
      const payload = { ...this.form };
      delete payload.createdAt;
      delete payload.updatedAt;
      if (this.modalType === 0) delete payload.id;
      await (this.modalType === 0
        ? this.$api.createMember(payload)
        : this.$api.updateMember(payload));
      this.getList();
      this.handleClose();
      this.$message({
        type: "success",
        message: this.modalType === 0 ? "添加成功" : "编辑成功",
      });
    },
    // 关闭弹窗
    handleClose() {
      this.form = createDefaultForm();
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
.level-badge {
  display: inline-block;
  padding: 1px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
}
.address-section {
  margin-top: 24px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
.address-empty {
  text-align: center;
  color: #909399;
  padding: 20px 0;
  font-size: 13px;
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

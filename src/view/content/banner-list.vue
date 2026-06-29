<template>
  <div class="page">
    <FilterBar @query="handleQuery" @reset="handleReset">
      <FilterBarItem label="标题">
        <el-input v-model="queryParam.title" placeholder="" clearable @keyup.enter="handleQuery" />
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
        <el-button type="primary" size="medium" @click="handleAdd">新增 Banner</el-button>
        <el-button type="danger" size="medium" :disabled="!selectedIds.length" @click="handleDelete(selectedIds)">批量删除</el-button>
      </div>
    </div>

    <div class="table-content">
      <el-table :data="tableData" stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="45" />
        <el-table-column label="图片" width="90">
          <template #default="scope">
            <el-image
              :src="scope.row.image"
              style="width:60px;height:36px;object-fit:cover;border-radius:4px"
              fit="cover"
              :preview-src-list="[scope.row.image]"
            />
          </template>
        </el-table-column>
        <el-table-column label="标题" min-width="160" show-overflow-tooltip>
          <template #default="scope">
            <el-link type="primary" :underline="false" @click="handleDetail(scope.row)">{{ scope.row.title }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="跳转链接" min-width="200" show-overflow-tooltip>
          <template #default="scope">{{ scope.row.link || '-' }}</template>
        </el-table-column>
        <el-table-column label="排序" width="70">
          <template #default="scope">{{ scope.row.sort }}</template>
        </el-table-column>
        <el-table-column label="生效时间" min-width="260">
          <template #default="scope">
            <span v-if="scope.row.start_time">{{ dayjs(scope.row.start_time).format('YYYY-MM-DD HH:mm') }}</span>
            <span v-else>-</span>
            <span> ~ </span>
            <span v-if="scope.row.end_time">{{ dayjs(scope.row.end_time).format('YYYY-MM-DD HH:mm') }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="70">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="mini">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="155">
          <template #default="scope">
            {{ dayjs(scope.row.createdAt).format('YYYY-MM-DD HH:mm') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button size="mini" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button
              size="mini"
              :type="scope.row.status === 1 ? 'warning' : 'success'"
              @click="handleToggleStatus(scope.row)"
            >
              {{ scope.row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button type="danger" size="mini" @click="handleDelete([scope.row.id])">删除</el-button>
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      :title="modalType === 0 ? '新增 Banner' : '编辑 Banner'"
      :visible.sync="isVisible"
      width="700px"
      :destroy-on-close="true"
      @close="handleClose"
    >
      <el-form ref="form" :model="form" :rules="formRules" label-width="120px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="图片" prop="image">
          <el-upload
            :action="uploadUrl"
            :headers="uploadHeaders"
            :on-success="handleUploadSuccess"
            :before-upload="beforeUpload"
            :show-file-list="false"
            accept="image/*"
          >
            <el-button size="small" type="primary">点击上传</el-button>
            <div slot="tip" class="el-upload__tip" style="display:inline;margin-left:8px">建议尺寸 1920x600，不超过 2MB</div>
          </el-upload>
          <div v-if="form.image" class="upload-preview">
            <el-image :src="form.image" style="max-width:360px;max-height:120px;margin-top:8px;border-radius:4px" fit="contain" />
          </div>
        </el-form-item>
        <el-form-item label="跳转链接" prop="link">
          <el-input v-model="form.link" placeholder="例如 /product/list" maxlength="500" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="生效时间">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="yyyy-MM-dd HH:mm:ss"
            :default-time="['00:00:00', '23:59:59']"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="选填" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="isVisible = false">取 消</el-button>
        <el-button type="primary" @click="submit">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import FilterBar from "@/components/filter/FilterBar";
import FilterBarItem from "@/components/filter/FilterBarItem";
import dayjs from "dayjs";
import Cookie from "js-cookie";

const QUERY_PARAM = {
  page: 1,
  pageSize: 10,
  title: '',
  status: '',
}

const createDefaultForm = () => ({
  title: '',
  image: '',
  link: '',
  sort: 0,
  remark: '',
  start_time: '',
  end_time: '',
})

export default {
  name: "BannerList",
  components: { FilterBar, FilterBarItem },
  data() {
    return {
      tableData: [],
      total: 0,
      queryParam: { ...QUERY_PARAM },
      selectedIds: [],
      isVisible: false,
      modalType: 0,
      form: createDefaultForm(),
      timeRange: null,
      formRules: {
        title: [
          { required: true, message: '请输入标题', trigger: 'blur' },
          { max: 200, message: '标题不超过200个字符', trigger: 'blur' }
        ],
        image: [
          { required: true, message: '请上传图片', trigger: 'change' }
        ],
      },
      uploadUrl: process.env.VUE_APP_API + '/uploadFiles',
    };
  },
  computed: {
      uploadHeaders() {
        return { Authorization: 'Bearer ' + Cookie.get('token') }
      }
  },
  created() {
    this.getList();
  },
  activated() {
    this.getList();
  },
  methods: {
    dayjs,
    async getList() {
      const params = { ...this.queryParam }
      Object.keys(params).forEach(k => {
        if (params[k] === '' || params[k] === null || params[k] === undefined) delete params[k]
      })
      const res = await this.$api.getBannerList(params);
      this.tableData = res.list;
      this.total = res.total;
    },
    handleCurrentChange(page) {
      this.queryParam.page = page;
      this.getList();
    },
    handleQuery() {
      this.queryParam.page = 1;
      this.getList();
    },
    handleReset() {
      this.queryParam = { ...QUERY_PARAM }
      this.getList()
    },
    handleSelectionChange(rows) {
      this.selectedIds = rows.map(r => r.id)
    },
    handleAdd() {
      this.modalType = 0
      this.form = createDefaultForm()
      this.timeRange = null
      this.isVisible = true
    },
    handleEdit(row) {
      this.modalType = 1
      this.form = { ...row }
      if (row.start_time && row.end_time) {
        this.timeRange = [row.start_time, row.end_time]
      } else {
        this.timeRange = null
      }
      this.isVisible = true
    },
    handleClose() {
      this.$refs.form.resetFields()
    },
    beforeUpload(file) {
      const isImage = file.type.startsWith('image/')
      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isImage) {
        this.$message.error('只能上传图片文件')
        return false
      }
      if (!isLt2M) {
        this.$message.error('图片大小不能超过 2MB')
        return false
      }
      return true
    },
    handleUploadSuccess(res) {
      if (res.code === 200) {
        this.form.image = res.data?.url || res.data
        this.$message.success('上传成功')
      } else {
        this.$message.error(res.message || '上传失败')
      }
    },
    async submit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return
        // 处理时间范围
        if (this.timeRange && this.timeRange.length === 2) {
          this.form.start_time = this.timeRange[0]
          this.form.end_time = this.timeRange[1]
        } else {
          this.form.start_time = ''
          this.form.end_time = ''
        }
        const data = { ...this.form }
        data.start_time = data.start_time || undefined
        data.end_time = data.end_time || undefined
        try {
          if (this.modalType === 0) {
            await this.$api.addBanner(data)
            this.$message({ type: 'success', message: '新增成功' })
          } else {
            await this.$api.updateBanner(data)
            this.$message({ type: 'success', message: '更新成功' })
          }
          this.isVisible = false
          this.getList()
        } catch (err) {
          this.$message({ type: 'error', message: err.message || '操作失败' })
        }
      })
    },
    async handleToggleStatus(row) {
      const newStatus = row.status === 1 ? 0 : 1
      await this.$api.updateBannerStatus({ id: row.id, status: newStatus })
      this.$message({ type: 'success', message: newStatus === 1 ? '已启用' : '已禁用' })
      this.getList()
    },
    handleDetail(row) {
      this.$alert(`标题：${row.title}\n链接：${row.link || '无'}\n排序：${row.sort}\n备注：${row.remark || '无'}`, 'Banner 详情')
    },
    handleDelete(ids) {
      if (!ids.length) return
      this.$confirm(`确定删除选中的 ${ids.length} 个Banner?`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.$api.deleteBanner({ ids }).then(() => {
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
  },
};
</script>

<style scoped lang="scss">
.upload-preview {
  display: flex;
  align-items: center;
}
</style>

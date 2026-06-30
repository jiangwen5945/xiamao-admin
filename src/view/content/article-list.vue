<template>
  <div class="page">
    <FilterBar @query="handleQuery" @reset="handleReset">
      <FilterBarItem label="公告标题">
        <el-input v-model="queryParam.title" placeholder="" clearable @keyup.enter="handleQuery" />
      </FilterBarItem>
      <FilterBarItem label="状态">
        <el-select v-model="queryParam.status" placeholder="全部" clearable>
          <el-option label="已发布" :value="1" />
          <el-option label="草稿" :value="0" />
        </el-select>
      </FilterBarItem>
    </FilterBar>

    <div class="table-header">
      <div class="left">
        <el-button type="primary" size="medium" @click="handleAdd">新增公告</el-button>
        <el-button type="danger" size="medium" :disabled="!selectedIds.length" @click="handleDelete(selectedIds)">批量删除</el-button>
      </div>
    </div>

    <div class="table-content">
      <el-table :data="tableData" stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="45" />
        <el-table-column label="标题" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            <span>
              <el-tag v-if="scope.row.is_top" type="warning" size="mini" style="margin-right:4px">置顶</el-tag>
              <el-link type="primary" :underline="false" @click="handleDetail(scope.row)">{{ scope.row.title }}</el-link>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="作者" width="120">
          <template #default="scope">{{ scope.row.author || '-' }}</template>
        </el-table-column>
        <el-table-column label="排序" width="60">
          <template #default="scope">{{ scope.row.sort }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'" size="mini">
              {{ scope.row.status === 1 ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发布时间" width="160">
          <template #default="scope">
            {{ scope.row.publish_time ? dayjs(scope.row.publish_time).format('YYYY-MM-DD HH:mm') : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="155">
          <template #default="scope">
            {{ dayjs(scope.row.createdAt).format('YYYY-MM-DD HH:mm') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="scope">
            <el-button
              size="mini"
              :type="scope.row.status === 1 ? 'warning' : 'success'"
              @click="handleToggleStatus(scope.row)"
            >
              {{ scope.row.status === 1 ? '下线' : '发布' }}
            </el-button>
            <el-button
              size="mini"
              :type="scope.row.is_top === 1 ? 'default' : 'warning'"
              @click="handleToggleTop(scope.row)"
            >
              {{ scope.row.is_top === 1 ? '取消置顶' : '置顶' }}
            </el-button>
            <el-button size="mini" @click="handleEdit(scope.row)">编辑</el-button>
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
      :title="modalType === 0 ? '新增公告' : '编辑公告'"
      :visible.sync="isVisible"
      width="800px"
      :destroy-on-close="true"
      @close="handleClose"
    >
      <el-form ref="form" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入公告标题" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="form.author" placeholder="选填" maxlength="100" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="置顶">
          <el-switch v-model="form.is_top" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="正文内容" prop="content">
          <quillEditor ref="quillEditor" v-model="form.content" :options="editorOption" class="editor" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="isVisible = false">取 消</el-button>
        <el-button type="primary" @click="submit">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      :visible.sync="detailVisible"
      title="公告详情"
      size="650px"
      :destroy-on-close="true"
    >
      <div class="drawer-body" v-if="currentDetail.id">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="标题">{{ currentDetail.title }}</el-descriptions-item>
          <el-descriptions-item label="作者">{{ currentDetail.author || '-' }}</el-descriptions-item>
          <el-descriptions-item label="排序">{{ currentDetail.sort }}</el-descriptions-item>
          <el-descriptions-item label="置顶">
            <el-tag :type="currentDetail.is_top === 1 ? 'warning' : 'info'" size="mini">
              {{ currentDetail.is_top === 1 ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentDetail.status === 1 ? 'success' : 'info'" size="mini">
              {{ currentDetail.status === 1 ? '已发布' : '草稿' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发布时间">
            {{ currentDetail.publish_time ? dayjs(currentDetail.publish_time).format('YYYY-MM-DD HH:mm') : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ dayjs(currentDetail.createdAt).format('YYYY-MM-DD HH:mm') }}
          </el-descriptions-item>
        </el-descriptions>

        <h4 class="detail-section-title">正文内容</h4>
        <div class="detail-content" v-html="$sanitize(currentDetail.content) || '暂无内容'" />
      </div>
    </el-drawer>
  </div>
</template>

<script>
import FilterBar from "@/components/filter/FilterBar";
import FilterBarItem from "@/components/filter/FilterBarItem";
import { quillEditor } from "vue-quill-editor";
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import 'quill/dist/quill.bubble.css'
import dayjs from "dayjs";
import { cleanParams } from "@/utils/helpers";

const QUERY_PARAM = {
  page: 1,
  pageSize: 10,
  title: '',
  status: '',
}

const createDefaultForm = () => ({
  title: '',
  content: '',
  author: '',
  sort: 0,
  status: 0,
  is_top: 0,
  publish_time: '',
})

const EDITOR_OPTION = {
  theme: 'snow',
  placeholder: '请输入公告正文内容（支持图文混排）',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ header: [1, 2, 3, false] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      [{ color: [] }, { background: [] }],
      ['link', 'image'],
      ['clean'],
    ],
  },
}

export default {
  name: "ArticleList",
  components: { FilterBar, FilterBarItem, quillEditor },
  data() {
    return {
      tableData: [],
      total: 0,
      queryParam: { ...QUERY_PARAM },
      selectedIds: [],
      isVisible: false,
      modalType: 0,
      form: createDefaultForm(),
      formRules: {
        title: [
          { required: true, message: '请输入公告标题', trigger: 'blur' },
          { max: 200, message: '标题不超过200个字符', trigger: 'blur' }
        ],
      },
      detailVisible: false,
      currentDetail: {},
      editorOption: EDITOR_OPTION,
    };
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
      try {
        const params = cleanParams(this.queryParam)
        const res = await this.$api.getArticleList(params);
        this.tableData = res.list;
        this.total = res.total;
      } catch (e) {
        // 错误已在拦截器中处理
      }
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
      this.isVisible = true
      this.$nextTick(() => this.setupEditorImageHandler())
    },
    handleEdit(row) {
      this.modalType = 1
      this.form = { ...row }
      this.isVisible = true
      this.$nextTick(() => this.setupEditorImageHandler())
    },
    handleClose() {
      this.$refs.form.resetFields()
    },
    setupEditorImageHandler() {
      const quill = this.$refs.quillEditor?.quill
      if (!quill) return
      const toolbar = quill.getModule('toolbar')
      toolbar.addHandler('image', () => {
        const input = document.createElement('input')
        input.setAttribute('type', 'file')
        input.setAttribute('accept', 'image/*')
        input.click()
        input.onchange = async () => {
          const file = input.files[0]
          if (!file) return
          const formData = new FormData()
          formData.append('file', file)
          formData.append('directory', 'article')
          try {
            const res = await this.$api.uploadFiles(formData)
            const range = quill.getSelection(true)
            quill.insertEmbed(range.index, 'image', res.url)
          } catch {
            this.$message.error('图片上传失败')
          }
        }
      })
    },
    async submit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return
        const data = { ...this.form }
        data.publish_time = undefined // 由后端在发布时自动设置
        try {
          if (this.modalType === 0) {
            await this.$api.addArticle(data)
            this.$message({ type: 'success', message: '新增成功' })
          } else {
            await this.$api.updateArticle(data)
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
      try {
        const newStatus = row.status === 1 ? 0 : 1
        await this.$api.updateArticleStatus({ id: row.id, status: newStatus })
        this.$message({ type: 'success', message: newStatus === 1 ? '已发布' : '已下线' })
        this.getList()
      } catch (e) {
        // 错误已在拦截器中处理
      }
    },
    async handleToggleTop(row) {
      try {
        const newTop = row.is_top === 1 ? 0 : 1
        await this.$api.toggleArticleTop({ id: row.id, is_top: newTop })
        this.$message({ type: 'success', message: newTop === 1 ? '已置顶' : '已取消置顶' })
        this.getList()
      } catch (e) {
        // 错误已在拦截器中处理
      }
    },
    async handleDetail(row) {
      try {
        const res = await this.$api.getArticleDetail({ id: row.id })
        this.currentDetail = res
        this.detailVisible = true
      } catch (e) {
        // 错误已在拦截器中处理
      }
    },
    async handleDelete(ids) {
      if (!ids.length) return
      try {
        await this.$confirm(`确定删除选中的 ${ids.length} 个公告?`, "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        })
        await this.$api.deleteArticle({ ids })
        this.$message({ type: "success", message: "删除成功!" });
        this.selectedIds = [];
        this.getList();
      } catch (e) {
        if (e === "cancel") return;
        // 错误已在拦截器中处理
      }
    },
  },
};
</script>

<style scoped lang="scss">
.editor {
  line-height: normal !important;
  height: 350px;
  p {
    line-height: 1.5em;
  }
}
.drawer-body {
  padding: 0 20px 20px;
}
.detail-section-title {
  margin: 20px 0 10px;
  font-size: 15px;
  color: #333;
}
.detail-content {
  color: #666;
  font-size: 14px;
  line-height: 1.8;
  img {
    max-width: 100%;
    height: auto;
  }
}
</style>

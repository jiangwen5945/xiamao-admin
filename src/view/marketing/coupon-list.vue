<template>
  <div class="page">
    <FilterBar @query="handleQuery" @reset="handleReset">
      <FilterBarItem label="名称">
        <el-input v-model="queryParam.name" placeholder="" clearable @keyup.enter="handleQuery" />
      </FilterBarItem>
      <FilterBarItem label="类型">
        <el-select v-model="queryParam.type" placeholder="全部" clearable>
          <el-option label="满减券" value="fixed" />
          <el-option label="折扣券" value="discount" />
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
        <el-button type="primary" size="medium" @click="handleAdd">新增</el-button>
        <el-button type="danger" size="medium" :disabled="!selectedIds.length" @click="handleDelete(selectedIds)">删除选中</el-button>
      </div>
    </div>

    <div class="table-content">
      <el-table :data="tableData" stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="45" />
        <el-table-column prop="name" label="名称" min-width="120">
          <template #default="scope">
            <el-link type="primary" :underline="false" @click="handleDetail(scope.row)">{{ scope.row.name }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="80">
          <template #default="scope">
            {{ scope.row.type === 'fixed' ? '满减券' : '折扣券' }}
          </template>
        </el-table-column>
        <el-table-column label="优惠内容" width="160">
          <template #default="scope">
            <span v-if="scope.row.type === 'fixed'">
              满 ¥{{ scope.row.min_amount }} 减 ¥{{ scope.row.value }}
            </span>
            <span v-else>
              {{ scope.row.value }} 折
            </span>
          </template>
        </el-table-column>
        <el-table-column label="发行总量" width="90">
          <template #default="scope">
            {{ scope.row.total_count || '不限' }}
          </template>
        </el-table-column>
        <el-table-column label="已发放" width="80" prop="used_count" />
        <el-table-column label="有效期" min-width="200">
          <template #default="scope">
            {{ scope.row.start_time | dateTime }} ~ {{ scope.row.end_time | dateTime }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="70">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="mini">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="150">
          <template #default="scope">{{ scope.row.created_at | dateTime }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <el-button size="mini" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="mini" @click="handleIssue(scope.row)">发放</el-button>
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      :title="modalType ? '修改优惠券' : '新增优惠券'"
      :visible="isVisible"
      :before-close="handleClose"
      center
      :destroy-on-close="true"
    >
      <el-form ref="form" :model="form" :rules="formRules" label-width="110px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入优惠券名称" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型" style="width:100%">
            <el-option label="满减券" value="fixed" />
            <el-option label="折扣券" value="discount" />
          </el-select>
        </el-form-item>
        <el-form-item label="优惠金额" prop="value" v-if="form.type === 'fixed'">
          <el-input v-model.number="form.value" placeholder="请输入减金额">
            <template slot="prepend">¥</template>
          </el-input>
        </el-form-item>
        <el-form-item label="折扣率" prop="value" v-else>
          <el-input v-model.number="form.value" placeholder="请输入折扣率，如 8.00 表示 8 折">
            <template slot="append">折</template>
          </el-input>
        </el-form-item>
        <el-form-item label="最低门槛" prop="min_amount">
          <el-input v-model.number="form.min_amount" placeholder="0 表示无门槛">
            <template slot="prepend">¥</template>
          </el-input>
        </el-form-item>
        <el-form-item label="发行总量" prop="total_count">
          <el-input-number v-model="form.total_count" :min="0" style="width:100%" placeholder="0 表示不限" />
        </el-form-item>
        <el-form-item label="有效期" required>
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="yyyy-MM-dd HH:mm:ss"
            style="width:100%"
          />
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

    <!-- 发放弹窗 -->
    <el-dialog
      title="发放优惠券"
      :visible="issueVisible"
      :before-close="handleIssueClose"
      center
      :destroy-on-close="true"
    >
      <el-form label-width="100px">
        <el-form-item label="优惠券">
          <span style="font-weight:600">{{ currentCouponName }}</span>
        </el-form-item>
        <el-form-item label="选择会员" prop="member_ids">
          <el-select v-model="issueForm.member_ids" multiple filterable remote placeholder="搜索会员手机号" style="width:100%"
            :remote-method="searchMember"
            :loading="memberLoading"
          >
            <el-option v-for="m in memberOptions" :key="m.id" :label="`${m.nickname} (${m.phone})`" :value="m.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleIssueClose">取 消</el-button>
        <el-button type="primary" @click="submitIssue" :disabled="!issueForm.member_ids.length">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      :visible.sync="detailVisible"
      title="优惠券详情"
      size="520px"
      :destroy-on-close="true"
    >
      <div class="drawer-body" v-if="currentDetail.id">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="名称">{{ currentDetail.name }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ currentDetail.type === 'fixed' ? '满减券' : '折扣券' }}</el-descriptions-item>
          <el-descriptions-item label="优惠内容">
            <span v-if="currentDetail.type === 'fixed'">满 ¥{{ currentDetail.min_amount }} 减 ¥{{ currentDetail.value }}</span>
            <span v-else>{{ currentDetail.value }} 折</span>
          </el-descriptions-item>
          <el-descriptions-item label="最低门槛">¥{{ currentDetail.min_amount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="发行总量">{{ currentDetail.total_count || '不限' }}</el-descriptions-item>
          <el-descriptions-item label="已发放">{{ currentDetail.used_count || 0 }}</el-descriptions-item>
          <el-descriptions-item label="有效期">{{ currentDetail.start_time | dateTime }} ~ {{ currentDetail.end_time | dateTime }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentDetail.status === 1 ? 'success' : 'danger'" size="mini">
              {{ currentDetail.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentDetail.created_at | dateTime }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import FilterBar from "@/components/filter/FilterBar.vue";
import FilterBarItem from "@/components/filter/FilterBarItem";
import dayjs from "dayjs";
import { cleanParams } from "@/utils/helpers";

const QUERY_PARAM = {
  page: 1,
  pageSize: 10,
  name: '',
  type: '',
  status: '',
}
const createDefaultForm = () => ({
  id: '',
  name: '',
  type: 'fixed',
  value: '',
  min_amount: 0,
  total_count: 0,
  start_time: '',
  end_time: '',
  status: 1,
})

export default {
  name: 'CouponList',
  components: { FilterBar, FilterBarItem },
  filters: {
    dateTime(val) {
      return val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'
    },
  },
  data() {
    return {
      tableData: [],
      total: 0,
      isVisible: false,
      modalType: 0,
      form: createDefaultForm(),
      dateRange: [],
      queryParam: { ...QUERY_PARAM },
      formRules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
        type: [{ required: true, message: '请选择类型', trigger: 'change' }],
        value: [{ required: true, message: '请输入优惠金额/折扣率', trigger: 'blur' }],
        min_amount: [{ required: true, message: '请输入最低门槛', trigger: 'blur' }],
      },
      selectedIds: [],
      detailVisible: false,
      currentDetail: {},
      issueVisible: false,
      issueForm: { coupon_def_id: '', member_ids: [] },
      currentCouponName: '',
      memberOptions: [],
      memberLoading: false,
    }
  },
  created() {
    this.getList()
  },
  activated() {
    this.getList()
  },
  methods: {
    async getList() {
      try {
        const params = cleanParams(this.queryParam)
        const res = await this.$api.getCouponList(params)
        this.tableData = res.list
        this.total = res.total
      } catch (e) {
        // 错误已在拦截器中处理
      }
    },
    handleCurrentChange(page) {
      this.queryParam.page = page
      this.getList()
    },
    handleQuery() {
      this.queryParam.page = 1
      this.getList()
    },
    handleReset() {
      this.queryParam = { ...QUERY_PARAM }
      this.getList()
    },
    handleSelectionChange(rows) {
      this.selectedIds = rows.map(r => r.id)
    },
    async handleDelete(ids) {
      if (!Array.isArray(ids)) ids = [ids.id]
      if (!ids.length) return
      try {
        await this.$confirm(`确定删除选中的 ${ids.length} 个优惠券?`, '提示', {
          confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
        })
        await this.$api.deleteCoupon({ ids })
        this.$message({ type: 'success', message: '删除成功!' })
        this.selectedIds = []
        this.getList()
      } catch (e) {
        if (e === 'cancel') return
        // 错误已在拦截器中处理
      }
    },
    handleDetail(row) {
      this.currentDetail = row
      this.detailVisible = true
    },
    handleEdit(row) {
      this.isVisible = true
      this.modalType = 1
      this.form = JSON.parse(JSON.stringify(row))
      this.dateRange = row.start_time && row.end_time ? [row.start_time, row.end_time] : []
    },
    handleAdd() {
      this.form = createDefaultForm()
      this.dateRange = []
      this.isVisible = true
      this.modalType = 0
    },
    async submit() {
      if (!this.dateRange || this.dateRange.length !== 2) {
        this.$message.warning('请选择优惠券有效期')
        return
      }
      try {
        await this.$refs.form.validate()
        const payload = { ...this.form }
        delete payload.created_at
        delete payload.updated_at
        payload.start_time = this.dateRange[0]
        payload.end_time = this.dateRange[1]
        if (this.modalType === 0) {
          delete payload.id
          await this.$api.createCoupon(payload)
        } else {
          delete payload.used_count
          await this.$api.updateCoupon(payload)
        }
        this.$message({ type: 'success', message: this.modalType === 0 ? '添加成功' : '编辑成功' })
        this.getList()
        this.handleClose()
      } catch (e) {
        // 校验失败或业务错误已在拦截器中处理
      }
    },
    handleClose() {
      this.form = createDefaultForm()
      this.dateRange = []
      this.isVisible = false
      this.$refs.form.clearValidate()
    },
    handleIssue(row) {
      this.issueForm = { coupon_def_id: row.id, member_ids: [] }
      this.currentCouponName = row.name
      this.memberOptions = []
      this.issueVisible = true
    },
    handleIssueClose() {
      this.issueVisible = false
    },
    async searchMember(query) {
      if (!query) return
      this.memberLoading = true
      try {
        const res = await this.$api.getMemberList({ phone: query, pageSize: 20 })
        this.memberOptions = res.list || []
      } catch {
        this.memberOptions = []
      } finally {
        this.memberLoading = false
      }
    },
    async submitIssue() {
      try {
        await this.$api.issueCoupon(this.issueForm)
        this.$message({ type: 'success', message: '发放成功!' })
        this.issueVisible = false
        this.getList()
      } catch (e) {
        // 错误已在拦截器中处理
      }
    },
  },
}
</script>

<style scoped lang="scss">
.drawer-body {
  padding: 0 20px 20px;
}
</style>

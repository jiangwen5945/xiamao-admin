<template>
  <div class="page">
    <FilterBar @query="handleQuery" @reset="handleReset">
      <FilterBarItem label="活动名称">
        <el-input v-model="queryParam.name" placeholder="" clearable @keyup.enter="handleQuery" />
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
        <el-table-column prop="name" label="活动名称" min-width="140">
          <template #default="scope">
            <el-link type="primary" :underline="false" @click="handleDetail(scope.row)">{{ scope.row.name }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" width="150">
          <template #default="scope">{{ scope.row.start_time | dateTime }}</template>
        </el-table-column>
        <el-table-column label="结束时间" width="150">
          <template #default="scope">{{ scope.row.end_time | dateTime }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="scope">
            <el-tag :type="statusTagType(scope.row)" size="mini">{{ statusLabel(scope.row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="150">
          <template #default="scope">{{ scope.row.created_at | dateTime }}</template>
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      :title="modalType ? '修改秒杀活动' : '新增秒杀活动'"
      :visible="isVisible"
      :before-close="handleClose"
      center
      :destroy-on-close="true"
    >
      <el-form ref="form" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="活动名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入活动名称" />
        </el-form-item>
        <el-form-item label="活动时间" required>
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

    <!-- 详情抽屉 -->
    <el-drawer
      :visible.sync="detailVisible"
      title="秒杀活动详情"
      size="650px"
      :destroy-on-close="true"
    >
      <div class="drawer-body" v-if="currentDetail.id">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="活动名称">{{ currentDetail.name }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ currentDetail.start_time | dateTime }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ currentDetail.end_time | dateTime }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(currentDetail)" size="mini">{{ statusLabel(currentDetail) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentDetail.created_at | dateTime }}</el-descriptions-item>
        </el-descriptions>

        <h4 class="detail-section-title">秒杀商品</h4>
        <el-button type="primary" size="small" @click="handleItemAdd">添加商品</el-button>
        <el-table :data="itemList" size="small" border style="margin-top:12px">
          <el-table-column label="商品名称" min-width="120">
            <template #default="scope">
              {{ scope.row.Product?.name || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="原价" width="80">
            <template #default="scope">
              ¥{{ scope.row.Product?.price || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="秒杀价" width="90" prop="flash_price" />
          <el-table-column label="库存" width="70" prop="stock" />
          <el-table-column label="已售" width="70" prop="sales_count" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="scope">
              <el-button size="mini" @click="handleItemEdit(scope.row)">编辑</el-button>
              <el-button type="danger" size="mini" @click="handleItemDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <p v-if="!itemList.length" class="detail-empty">暂无秒杀商品</p>
      </div>
    </el-drawer>

    <!-- 秒杀商品新增/编辑弹窗 -->
    <el-dialog
      :title="itemModalType ? '修改秒杀商品' : '添加秒杀商品'"
      :visible="itemVisible"
      :before-close="handleItemClose"
      center
      :destroy-on-close="true"
    >
      <el-form ref="itemForm" :model="itemForm" :rules="itemRules" label-width="100px">
        <el-form-item label="商品" prop="product_id" v-if="!itemModalType">
          <el-select v-model="itemForm.product_id" placeholder="请选择商品" filterable style="width:100%">
            <el-option v-for="p in productOptions" :key="p.id" :label="`${p.name} (¥${p.price})`" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品" v-else>
          <span style="font-weight:600">{{ currentProductName }}</span>
        </el-form-item>
        <el-form-item label="秒杀价" prop="flash_price">
          <el-input v-model.number="itemForm.flash_price" placeholder="请输入秒杀价">
            <template slot="prepend">¥</template>
          </el-input>
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="itemForm.stock" :min="1" style="width:100%" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleItemClose">取 消</el-button>
        <el-button type="primary" @click="submitItem">确 定</el-button>
      </div>
    </el-dialog>
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
  status: '',
}
const createDefaultForm = () => ({
  id: '',
  name: '',
  start_time: '',
  end_time: '',
  status: 1,
})

export default {
  name: 'FlashSaleList',
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
        name: [{ required: true, message: '活动名称不能为空', trigger: 'blur' }],
      },
      selectedIds: [],
      detailVisible: false,
      currentDetail: {},
      itemList: [],
      itemVisible: false,
      itemModalType: 0,
      itemForm: { flash_sale_id: '', product_id: '', flash_price: '', stock: 1 },
      currentProductName: '',
      productOptions: [],
      productLoading: false,
      itemRules: {
        product_id: [{ required: true, message: '请选择商品', trigger: 'change' }],
        flash_price: [{ required: true, message: '请输入秒杀价', trigger: 'blur' }],
        stock: [{ required: true, message: '请输入库存', trigger: 'blur' }],
      },
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
        const res = await this.$api.getFlashSaleList(params)
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
        await this.$confirm(`确定删除选中的 ${ids.length} 个秒杀活动?`, '提示', {
          confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
        })
        await this.$api.deleteFlashSale({ ids })
        this.$message({ type: 'success', message: '删除成功!' })
        this.selectedIds = []
        this.getList()
      } catch (e) {
        if (e === 'cancel') return
        // 错误已在拦截器中处理
      }
    },
    statusLabel(row) {
      if (row.status === 0) return '已禁用'
      const now = Date.now()
      const start = new Date(row.start_time).getTime()
      const end = new Date(row.end_time).getTime()
      if (now < start) return '未开始'
      if (now > end) return '已结束'
      return '进行中'
    },
    statusTagType(row) {
      if (row.status === 0) return 'danger'
      const now = Date.now()
      const start = new Date(row.start_time).getTime()
      const end = new Date(row.end_time).getTime()
      if (now < start) return 'info'
      if (now > end) return 'warning'
      return 'success'
    },
    async handleDetail(row) {
      try {
        const res = await this.$api.getFlashSaleDetail({ id: row.id })
        this.currentDetail = res
        this.itemList = res.FlashSaleItems || []
        this.detailVisible = true
      } catch (e) {
        // 错误已在拦截器中处理
      }
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
        this.$message.warning('请选择活动时间')
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
          await this.$api.createFlashSale(payload)
        } else {
          await this.$api.updateFlashSale(payload)
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
    async handleItemAdd() {
      this.itemModalType = 0
      this.itemForm = { flash_sale_id: this.currentDetail.id, product_id: '', flash_price: '', stock: 1 }
      this.currentProductName = ''
      this.productLoading = true
      try {
        const res = await this.$api.getProductsNotInFlashSale({ flash_sale_id: this.currentDetail.id })
        this.productOptions = res || []
      } catch {
        this.productOptions = []
      } finally {
        this.productLoading = false
      }
      this.itemVisible = true
    },
    handleItemEdit(row) {
      this.itemModalType = 1
      this.itemForm = {
        id: row.id,
        flash_price: row.flash_price,
        stock: row.stock,
      }
      this.currentProductName = row.Product?.name || ''
      this.itemVisible = true
    },
    handleItemClose() {
      this.itemVisible = false
      this.$refs.itemForm?.clearValidate()
    },
    async submitItem() {
      try {
        await this.$refs.itemForm.validate()
        if (this.itemModalType === 0) {
          await this.$api.addFlashSaleItem(this.itemForm)
        } else {
          await this.$api.updateFlashSaleItem(this.itemForm)
        }
        this.$message({ type: 'success', message: this.itemModalType === 0 ? '添加成功' : '编辑成功' })
        this.handleItemClose()
        const res = await this.$api.getFlashSaleDetail({ id: this.currentDetail.id })
        this.currentDetail = res
        this.itemList = res.FlashSaleItems || []
      } catch (e) {
        // 校验失败或业务错误已在拦截器中处理
      }
    },
    async handleItemDelete(row) {
      try {
        await this.$confirm('确定删除该秒杀商品?', '提示', {
          confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
        })
        await this.$api.deleteFlashSaleItem({ id: row.id })
        this.$message({ type: 'success', message: '删除成功!' })
        const res = await this.$api.getFlashSaleDetail({ id: this.currentDetail.id })
        this.currentDetail = res
        this.itemList = res.FlashSaleItems || []
      } catch (e) {
        if (e === 'cancel') return
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
.detail-section-title {
  margin: 20px 0 10px;
  font-size: 15px;
  color: #333;
}
.detail-empty {
  color: #999;
  font-size: 13px;
  margin-top: 8px;
}
</style>

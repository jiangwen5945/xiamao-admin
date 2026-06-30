<template>
  <div class="page" v-loading="loading">
    <FilterBar @query="getList" @reset="handleReset">
      <FilterBarItem label="字典类型">
        <el-select v-model="currentType" placeholder="请选择字典类型" @change="getList" clearable>
          <el-option
            v-for="item in typeOptions"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
      </FilterBarItem>
    </FilterBar>

    <div class="table-header">
      <div class="left">
        <el-button type="primary" size="medium" :disabled="!currentType" @click="handleAdd">新增</el-button>
      </div>
    </div>

    <div class="table-content">
      <el-table :data="tableData" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="type_code" label="类型编码" />
        <el-table-column prop="item_code" label="项编码" />
        <el-table-column prop="item_name" label="项名称" />
        <el-table-column prop="sort_order" label="排序" width="60" />
        <el-table-column prop="status" label="状态" width="70">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="mini">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button size="mini" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" size="mini" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog
      :title="modalType ? '修改字典项' : '新增字典项'"
      :visible="isVisible"
      :before-close="handleClose"
      center
      width="520px"
      :destroy-on-close="true"
    >
      <el-form ref="form" :model="form" :rules="formRules" label-width="100px" class="dialog-form">
        <el-form-item label="类型编码">
          <el-input v-model="currentType" disabled />
        </el-form-item>
        <el-form-item label="项编码" prop="item_code">
          <el-input v-model="form.item_code" placeholder="请输入项编码" :disabled="modalType === 1" />
        </el-form-item>
        <el-form-item label="项名称" prop="item_name">
          <el-input v-model="form.item_name" placeholder="请输入项名称" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
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
import FilterBar from "@/components/filter/FilterBar";
import FilterBarItem from "@/components/filter/FilterBarItem";

const createDefaultForm = () => ({
  item_code: '', item_name: '', sort_order: 0, status: 1, remark: '',
})

export default {
  name: 'DictList',
  components: { FilterBar, FilterBarItem },
  data() {
    return {
      loading: false,
      tableData: [],
      typeOptions: [],
      currentType: '',
      isVisible: false,
      modalType: 0,
      form: createDefaultForm(),
      formRules: {
        item_code: [{ required: true, message: '项编码不能为空', trigger: 'blur' }],
        item_name: [{ required: true, message: '项名称不能为空', trigger: 'blur' }],
      },
    }
  },
  async created() {
    await this.loadTypes()
  },
  activated() {
    if (this.currentType) this.getList()
  },
  methods: {
    async loadTypes() {
      try {
        const data = await this.$api.getDictAdminTypes()
        this.typeOptions = data || []
        if (this.typeOptions.length > 0) {
          this.currentType = this.typeOptions[0]
          await this.getList()
        }
  } catch (e) {
    // 错误已在拦截器中处理
  }
    },
    async getList() {
      if (!this.currentType) return
      this.loading = true
      try {
        const data = await this.$api.getDictAdminList(this.currentType)
        this.tableData = data || []
      } finally {
        this.loading = false
      }
    },
    handleReset() {
      if (this.typeOptions.length > 0) {
        this.currentType = this.typeOptions[0]
        this.getList()
      }
    },
    handleAdd() {
      this.form = createDefaultForm()
      this.isVisible = true
      this.modalType = 0
    },
    handleEdit(row) {
      this.isVisible = true
      this.modalType = 1
      this.form = {
        item_code: row.item_code,
        item_name: row.item_name,
        sort_order: row.sort_order,
        status: row.status,
        remark: row.remark,
      }
    },
    async handleDelete(row) {
      try {
        await this.$confirm('确定删除该字典项？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
        await this.$api.deleteDictItem(row.id)
        this.$message({ type: 'success', message: '删除成功' })
        this.getList()
      } catch (e) {
        if (e === 'cancel') return
        // 错误已在拦截器中处理
      }
    },
    async submit() {
      try {
        await this.$refs.form.validate()
        if (this.modalType === 0) {
          await this.$api.createDictItem(this.currentType, this.form)
        } else {
          const row = this.tableData.find(r => r.item_code === this.form.item_code)
          await this.$api.updateDictItem(row.id, this.form)
        }
        this.$message({
          type: 'success',
          message: this.modalType === 0 ? '添加成功' : '修改成功',
        })
        this.handleClose()
        await this.getList()
      } catch (e) {
        // 校验失败或业务错误已在拦截器中处理
      }
    },
    handleClose() {
      this.form = createDefaultForm()
      this.isVisible = false
      this.$refs.form.clearValidate()
    },
  },
}
</script>

<style scoped lang="scss">
.dialog-form {
  padding: 10px 20px 0;
}
</style>

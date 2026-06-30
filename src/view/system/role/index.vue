<template>
  <div class="page">
    <!-- 头部 -->
    <div class="table-header">
      <div class="left">
        <el-button type="primary" size="medium" @click="handleAdd">新增角色</el-button>
      </div>
    </div>

    <!-- 表格内容 -->
    <div class="table-content">
      <el-table :data="tableData" stripe>
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="角色ID"></el-table-column>
        <el-table-column prop="name" label="角色名称"></el-table-column>
        <el-table-column prop="menuNames" label="菜单权限" width="500">
          <template #default="scope">
            <el-tag
              v-for="(item, index) in scope.row.menuNames"
              :key="index"
              size="mini"
              style="margin-right: 4px"
            >
              {{ item }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="是否开启">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
            >
            </el-switch>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button size="mini" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" size="mini" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页器 -->
      <el-pagination
        layout="prev, pager, next"
        :total="count"
        :page-size="queryParam.total"
        :current-page.sync="queryParam.page"
        class="pagination"
        @current-change="handleCurrentChange"
      >
      </el-pagination>
    </div>

    <!-- 新增/编辑 弹出层 -->
    
    <el-dialog 
      :title="modalType ? '修改角色':'新增角色'" 
      :visible.sync="isVisible" 
      :before-close="handleClose" 
      center 
      width="30%" 
      :destroy-on-close="true"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model.number="form.name" autocomplete="off" placeholder="请输入角色名称"></el-input>
        </el-form-item>
        <el-form-item label="角色菜单" prop="menuIds">
          <el-tree
            ref="refTree"
            :data="menuList"
            show-checkbox
            node-key="id"
            check-strictly
            :default-checked-keys="form.menuIds"
            :default-expanded-keys="form.menuIds"
            @check-change="handleCheckChange"
            :props="{
              children: 'children',
              label: 'name'
            }"
          />
        </el-form-item>
        <el-form-item label="是否开启">
          <el-switch
            v-model="form.status"
            :active-value="1"
            :inactive-value="0"
          >
          </el-switch>
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

import rules from '@/utils/rules'

const QUERY_PARAM = { page: 1, total: 10 }
const createDefaultForm = () => ({ id: '', name: '', menuIds: [], status: false })

export default {
  name: 'RoleList',

  data() {
    return {
      tableData: [],
      count: 0,
      queryParam: { ...QUERY_PARAM },
      isVisible: false,
      modalType: 0,
      rules,
      menuList: [],
      form: createDefaultForm(),
    }
  },

  created() {
    this.getData()
  },

  mounted() {
    // 获取菜单列表数据
    this.$api.getMenuList().then(res => {
      this.menuList = this.buildTree(res.list)
      console.log('this.menuList111', this.menuList);
      
      // this.menuList = res.list
    })
  },

  // keep-alive 缓存组件激活时重新获取数据
  activated() {
    this.getData()
  },

  methods: {
    /** 将扁平菜单列表组装为树结构 */
    buildTree(menus, parentId = null) {
      return menus
        .filter((m) => m.parent_id === parentId)
        .map((m) => ({
          ...m,
          children: this.buildTree(menus, m.id),
        }))
    },

    /** 获取列表数据 */
    async getData() {
      const { list, total } = await this.$api.getRoleList(this.queryParam)
      this.tableData = list
      this.tableData.forEach(item => {
        if (item.Menus) {
          item.menuNames = item.Menus.map(v => {
            if (v.type != 1 ) {
              return v.name
            }
          }).filter(Boolean)
        }
      })
      this.count = total
    },

    /** 删除角色（含确认弹窗） */
    handleDelete(id) {
      this.$confirm('确定删除?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$api.deleteRole(id).then(() => {
          this.$message({ type: 'success', message: '删除成功!' })
          this.getData()
        })
      }).catch(err => {
        if (err === 'cancel') return
        this.$message({ type: 'error', message: err })
      })
    },

    /** 打开新增弹窗 */
    handleAdd() {
      this.form = createDefaultForm()
      this.isVisible = true
      this.modalType = 0
    },

    /** 打开编辑弹窗 */
    handleEdit(row) {
      this.isVisible = true
      this.modalType = 1
      const cloneRow = JSON.parse(JSON.stringify(row))
       // 后端返回的 Roles 是对象数组，提取 id 转成 checkox 所需的数组
      if (Array.isArray(cloneRow.Menus)) {
        cloneRow.menuIds = cloneRow.Menus.map((item) => item.id)
      }
      console.log('cloneRow', cloneRow);
      
      this.form = cloneRow
    },

    /** 提交表单 */
    async submit() {
      const valid = await this.$refs.form.validate().catch(() => false)
      if (!valid) return
      if (this.modalType === 0) {
        await this.$api.createRole(this.form)
      } else {
        await this.$api.updateRole(this.form)
      }
      // 刷新当前用户的菜单缓存，避免需要重新登录才能生效
      const menus = await this.$api.getUserMenus()
      await this.$store.dispatch('updateMenuArray', menus)
      await this.$store.dispatch('addMenuToRouter', this.$router)
      this.getData()
      this.handleClose()
      this.$message({
        type: 'success',
        message: this.modalType === 0 ? '添加成功' : '编辑成功'
      })
    },

    /** 关闭弹窗，重置表单并清除校验 */
    handleClose() {
      this.form = createDefaultForm()
      this.isVisible = false
      this.$refs.form.clearValidate()
    },

    /** 节点选中状态变化时更新表单中的权限字段 */
    handleCheckChange() {
      this.form.menuIds = this.$refs.refTree.getCheckedKeys()
    },

    handleCurrentChange(currentPageNum) {
      this.queryParam.page = currentPageNum
      this.getData()
    }
  }
}
</script>
<style scoped lang="scss"></style>

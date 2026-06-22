<template>
  <div class="page">
    <!-- 头部：新增按钮 -->
    <div class="table-header">
      <div class="left">
        <el-button type="primary" size="medium" @click="handleAdd">新增</el-button>
      </div>
    </div>

    <!-- 菜单列表（树形表格） -->
    <div class="table-content">
      <el-table
        :data="tableData"
        stripe
        row-key="id"
        :tree-props="{ children: 'children' }"
        default-expand-all
      >
        <!-- <el-table-column prop="id" label="ID" /> -->
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="icon" label="图标">
          <template #default="scope">
            <i :class="'el-icon-' + scope.row.icon" />
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" width="200" />
        <el-table-column prop="component" label="组件路径" width="200" />
        <el-table-column prop="sort" label="排序" width="60" />
        <el-table-column prop="type" label="类型" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.type === 1 ? 'success' : ''" round size="mini">
              {{ scope.row.type === 2 ? "菜单" : "目录" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="mini">
              {{ scope.row.status === 1 ? '生效' : '失效' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="show_sidebar" label="菜单栏" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.show_sidebar === 1 ? 'success' : 'danger'" size="mini">
              {{ scope.row.show_sidebar === 1 ? '显示' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="scope">
            <el-button size="mini" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" size="mini" @click="handleDelete({ id: scope.row.id })">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      :title="modalType ? '修改菜单' : '新增菜单'"
      :visible.sync="isVisible"
      :before-close="handleClose"
      center
      width="40%"
      :destroy-on-close="true"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <!-- 上级菜单 -->
        <el-form-item label="上级菜单" prop="parent_id">
          <el-cascader
            v-model="form.parent_id"
            :options="menuTreeOptions"
            :props="cascaderProps"
            :disabled="parentDisabled"
            placeholder="请选择上级菜单"
            clearable
            style="width: 100%"
          />
        </el-form-item>

        <!-- 菜单类型：1-目录 / 2-菜单 -->
        <el-form-item label="菜单类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="目录" :value="1" />
            <el-option label="菜单" :value="2" />
          </el-select>
        </el-form-item>

        <!-- 菜单名称 -->
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入名称" />
        </el-form-item>

        <!-- 图标 -->
        <el-form-item label="图标" prop="icon">
          <el-select
            v-model="form.icon"
            placeholder="请选择图标"
            clearable
            filterable
            allow-create
            style="width: 100%"
          >
            <el-option v-for="item in iconList" :key="item" :label="item" :value="item">
              <i :class="'el-icon-' + item" /> {{ item }}
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 路由路径 -->
        <el-form-item label="路由路径" prop="path">
          <el-input v-model="form.path" placeholder="请输入路由路径" />
        </el-form-item>

        <!-- 组件路径 -->
        <el-form-item v-if="form.type === 2" label="组件路径" prop="component">
          <el-input v-model="form.component" placeholder="请输入组件路径" />
        </el-form-item>

        <!-- 排序 -->
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>

        <!-- 状态 -->
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>

        <!-- 是否在侧边菜单栏显示 -->
        <el-form-item label="菜单栏">
          <el-switch v-model="form.show_sidebar" :active-value="1" :inactive-value="0"/>
        </el-form-item>
      </el-form>

      <!-- 弹窗底部按钮 -->
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleClose">取 消</el-button>
        <el-button type="primary" @click="submit">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getMenuList, deleteMenu, createMenu, updateMenu } from "../api";

export default {
  name: "MenuManage",

  data() {
    return {
      /** 表格数据（树形结构，包含 children） */
      tableData: [],

      /** API 返回的扁平菜单列表 */
      flatList: [],

      /** 弹窗显示状态 */
      isVisible: false,

      /** 弹窗模式：0-新增 / 1-编辑 */
      modalType: 0,

      /** 表单初始快照，用于关闭弹窗时重置 */
      defaultForm: null,

      /** Element UI 图标列表 */
      iconList: [
        's-home',
        'user', 
        'turn-off', 's-check', 's-marketing', 'box',
        's-order', 's-grid', 's-claim', 'document', 'document-copy',
        'edit-outline', 'files',
      ],

      /** 表单数据 */
      form: {
        parent_id: null, // 上级菜单 ID
        type: 2,        // 类型：1-目录 / 2-菜单
        name: "",       // 菜单名称
        icon: "",       // 图标名称
        path: "",       // 路由路径
        component: "",  // 组件路径
        sort: 0,        // 排序号
        status: 1,      // 状态：0-禁用 / 1-启用
        show_sidebar: 1, // 菜单栏显示：0-隐藏 / 1-显示
      },

      /** 表单校验规则 */
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
        type: [{ required: true, message: '类型不能为空', trigger: 'change' }],
        path: [{ required: true, message: '路由路径不能为空', trigger: 'blur' }],
      },
    };
  },

  computed: {
    /** 级联选择器的字段映射配置 */
    cascaderProps() {
      return {
        value: 'id',
        label: 'name',
        children: 'children',
        checkStrictly: true,
        emitPath: false,
      }
    },

    /** 上级菜单选项：只保留类型为目录（type === 1）的节点 */
    menuTreeOptions() {
      const filterTree = (list) =>
        list
          .filter((item) => item.type === 1)
          .map((item) => ({
            ...item,
            children: item.children ? filterTree(item.children) : undefined,
          }))
      return filterTree(this.tableData)
    },

    /** 上级菜单是否禁用：新增时始终可用；编辑时，目录且无上级才禁用 */
    parentDisabled() {
      if (this.modalType === 0) return false
      return this.form.type === 1 && !this.form.parent_id
    },
  },

  created() {
    // 初始化获取菜单列表
    this.getData()
    // 保存表单初始状态，用于重置
    this.defaultForm = JSON.parse(JSON.stringify(this.form))
  },

  // 当菜单类型为目录时，组件路径设置为空
  watch: {
    'form.type'(type) {
      if (type === 1) {
        this.form.component = ''
      }
    },
  },

  activated() {
    // keep-alive 激活时重新获取数据
    this.getData()
  },

  methods: {
    /** 获取菜单列表：后端返回扁平数据，前端组装树 */
    async getData() {
      const { list } = await getMenuList();
      this.flatList = list;
      this.tableData = this.buildTree(list);
    },

    /** 将扁平菜单列表组装为树结构 */
    buildTree(menus, parentId = null) {
      return menus
        .filter((m) => m.parent_id === parentId)
        .map((m) => ({
          ...m,
          children: this.buildTree(menus, m.id),
        }))
    },

    /** 删除菜单 */
    handleDelete(row) {
      const { id } = row
      // 有子菜单时禁止删除
      if (this.flatList.some((m) => m.parent_id === id)) {
        return this.$message({ type: 'warning', message: '该菜单下有子菜单，无法删除' })
      }
      this.$confirm('确定删除?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          deleteMenu({ id }).then(() => {
            this.$message({ type: 'success', message: '删除成功!' });
            this.getData();
          });
        })
        .catch((err) => {
          if (err === 'cancel') return;
          this.$message({ type: 'error', message: err });
        });
    },

    /** 编辑菜单：打开弹窗并填充当前行数据 */
    handleEdit(row) {
      this.isVisible = true;
      this.modalType = 1;
      this.form = JSON.parse(JSON.stringify(row));
    },

    /** 新增菜单：打开弹窗，表单使用默认值 */
    handleAdd() {
      this.isVisible = true;
      this.modalType = 0;
    },

    /** 提交表单 */
    submit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return;

        if (this.modalType === 0) {
          await createMenu(this.form);
        } else {
          await updateMenu(this.form);
        }
        this.getData();
        this.handleClose();
        this.$message({
          type: 'success',
          message: this.modalType === 0 ? '添加成功' : '编辑成功',
        });
      });
    },

    /** 关闭弹窗并重置表单 */
    handleClose() {
      this.form = JSON.parse(JSON.stringify(this.defaultForm));
      this.isVisible = false;
      this.$refs.form.clearValidate();
    },
  },
};
</script>

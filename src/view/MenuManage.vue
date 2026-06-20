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
        <el-table-column prop="id" label="ID" />
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
            <el-switch v-model="scope.row.status" :active-value="1" :inactive-value="0" />
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
        <el-form-item label="上级菜单" prop="parentId">
          <el-cascader
            v-model="form.parentId"
            :options="tableData"
            :props="cascaderProps"
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
        <el-form-item label="组件路径" prop="component">
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

      /** 弹窗显示状态 */
      isVisible: false,

      /** 弹窗模式：0-新增 / 1-编辑 */
      modalType: 0,

      /** 表单初始快照，用于关闭弹窗时重置 */
      initForm: null,

      /** Element UI 图标列表 */
      iconList: [
        'user', 'turn-off', 's-check', 's-marketing', 'box',
        's-order', 's-grid', 's-claim', 'document', 'document-copy',
        'edit-outline', 'files',
      ],

      /** 表单数据 */
      form: {
        parentId: null, // 上级菜单 ID
        type: 1,        // 类型：1-目录 / 2-菜单
        name: "",       // 菜单名称
        icon: "",       // 图标名称
        path: "",       // 路由路径
        component: "",  // 组件路径
        sort: 0,        // 排序号
        status: 1,      // 状态：0-禁用 / 1-启用
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
  },

  created() {
    // 初始化获取菜单列表
    this.getData()
    // 保存表单初始状态，用于重置
    this.initForm = JSON.parse(JSON.stringify(this.form))
  },

  activated() {
    // keep-alive 激活时重新获取数据
    this.getData()
  },

  methods: {
    /** 获取菜单列表 */
    async getData() {
      const { list } = await getMenuList();
      this.tableData = list;
    },

    /** 删除菜单 */
    handleDelete(id) {
      this.$confirm('确定删除?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          deleteMenu(id).then(() => {
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
      this.form = { ...this.initForm };
      this.isVisible = false;
      this.$refs.form.clearValidate();
    },
  },
};
</script>

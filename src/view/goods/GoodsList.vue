<template>
  <div class="page">
   

    <FilterBar @query="handleQuery" @reset="handleReset">
      <FilterBarItem label="商品名称">
        <el-input v-model="queryParam.name" placeholder="" clearable @keyup.enter="handleQuery" />
      </FilterBarItem>
      <FilterBarItem label="分类">
        <el-select v-model="queryParam.category_id" placeholder="全部" clearable filterable>
          <el-option v-for="item in categoryList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </FilterBarItem>
      <FilterBarItem label="品牌">
        <el-input v-model="queryParam.brand" placeholder="" clearable @keyup.enter="handleQuery" />
      </FilterBarItem>
      <FilterBarItem label="标签">
        <el-select v-model="queryParam.tags" placeholder="全部" clearable multiple collapse-tags collapse-tags-tooltip>
          <el-option v-for="t in tagOptions" :key="t" :label="t" :value="t" />
        </el-select>
      </FilterBarItem>
      <FilterBarItem label="状态">
        <el-select v-model="queryParam.status" placeholder="全部" clearable>
          <el-option label="上架" :value="1" />
          <el-option label="下架" :value="0" />
        </el-select>
      </FilterBarItem>
      <FilterBarItem label="价格">
        <div class="filter-price">
          <el-col :span="11">
            <el-input v-model="queryParam.price_min" placeholder="最低" @keyup.enter="handleQuery" />
          </el-col>
          <el-col class="line" :span="2">-</el-col>
          <el-col :span="11">
            <el-input v-model="queryParam.price_max" placeholder="最高" @keyup.enter="handleQuery" />
          </el-col>
        </div>
      </FilterBarItem>
    </FilterBar>

     <div class="table-header">
      <div class="left">
        <el-button type="primary" size="medium" @click="handleAdd">新增</el-button>
        <el-button type="danger" size="medium" :disabled="!selectedIds.length" @click="handleDelete(selectedIds)">批量删除</el-button>
      </div>
    </div>

    <div class="table-content">
      <el-table :data="tableData" stripe @selection-change="handleSelectionChange" @sort-change="handleSortChange">
        <el-table-column type="selection" width="45" />
        <el-table-column prop="name" label="商品名称" min-width="140">
          <template #default="scope">
            <el-link type="primary" :underline="false" @click="handleDetail(scope.row)">
              {{ scope.row.name }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="编号" width="70" />
        <el-table-column label="图片" width="90">
          <template #default="scope">
            <el-image
              :src="scope.row.images?.[0]?.url"
              style="width:54px;height:54px;object-fit:cover;border-radius:4px"
              :preview-src-list="(scope.row.images || []).map(i => i.url)"
              fit="cover"
            />
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="90" sortable="custom" />
        <el-table-column prop="brand" label="品牌" width="100" />
        <el-table-column label="分类" width="100">
          <template #default="scope">
            {{ scope.row.Category?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="标签" width="160">
          <template #default="scope">
            <el-tag v-for="tag in scope.row.tags" :key="tag" size="mini" style="margin-right:4px">
              {{ tag }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="90" sortable="custom" />
        <el-table-column prop="stock" label="库存" width="100" sortable="custom" />
        <el-table-column label="商品状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="mini">
              {{ scope.row.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
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
        :page-size="queryParam.limit"
        :current-page.sync="queryParam.page"
        class="pagination"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog
      :title="modalType ? '修改商品' : '新增商品'"
      :visible="isVisible"
      :before-close="handleClose"
      center
      :destroy-on-close="true"
    >
      <el-form ref="form" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="商品描述">
          <el-input type="textarea" v-model="form.description" placeholder="请输入商品描述" :rows="3" />
        </el-form-item>
        <el-form-item label="商品品牌">
          <el-input v-model="form.brand" placeholder="请输入品牌名称" />
        </el-form-item>
        <el-form-item label="商品价格" prop="price">
          <el-input v-model.number="form.price" placeholder="请输入商品价格">
            <template slot="prepend">¥</template>
          </el-input>
        </el-form-item>
        <el-form-item label="商品分类" prop="category_id">
          <el-select v-model="form.category_id" placeholder="请选择分类" style="width:100%" filterable>
            <el-option v-for="item in categoryList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品标签">
          <el-checkbox-group v-model="form.tags" size="small">
            <el-checkbox label="新品" border />
            <el-checkbox label="热销" border />
            <el-checkbox label="推荐" border />
            <el-checkbox label="礼品" border />
            <el-checkbox label="夏季" border />
            <el-checkbox label="经典" border />
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="商品排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="商品库存" prop="stock">
          <el-input-number v-model="form.stock" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="商品图片">
          <el-upload
            action="/api/uploadFiles"
            :http-request="handleUploadFile"
            list-type="picture-card"
            :file-list="uploadFileList"
            :on-remove="handleRemove"
            ref="uploadRef"
          >
            <i class="el-icon-plus" />
          </el-upload>
        </el-form-item>
        <el-form-item label="是否上架">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="商品规格">
          <div v-for="(spec, index) in form.specs" :key="index" class="spec-row">
            <el-select v-model="spec.name" placeholder="规格名" style="width:110px">
              <el-option label="颜色" value="颜色" />
              <el-option label="尺寸" value="尺寸" />
              <el-option label="包装" value="包装" />
              <el-option label="尺码" value="尺码" />
              <el-option label="轴体" value="轴体" />
              <el-option label="封面" value="封面" />
            </el-select>
            <el-input v-model="spec.value" placeholder="规格值" style="width:130px" />
            <el-input-number v-model="spec.price" :min="0" placeholder="加价" style="width:140px" controls-position="right" />
            <el-input-number v-model="spec.stock" :min="0" placeholder="库存" style="width:140px" controls-position="right" />
            <el-button type="danger" icon="el-icon-delete" circle size="mini" @click="removeSpec(index)" />
          </div>
          <el-button type="primary" icon="el-icon-plus" size="mini" @click="addSpec">添加规格</el-button>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleClose">取 消</el-button>
        <el-button type="primary" @click="submit" :disabled="isUploading">确 定</el-button>
      </div>
    </el-dialog>

    <el-drawer
      :visible.sync="detailVisible"
      title="商品详情"
      size="520px"
      :destroy-on-close="true"
    >
      <div class="drawer-body" v-if="currentDetail.id">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="商品名称">{{ currentDetail.name }}</el-descriptions-item>
          <el-descriptions-item label="商品编号">{{ currentDetail.id }}</el-descriptions-item>
          <el-descriptions-item label="品牌">{{ currentDetail.brand || '-' }}</el-descriptions-item>
          <el-descriptions-item label="价格">¥{{ currentDetail.price }}</el-descriptions-item>
          <el-descriptions-item label="商品分类">{{ currentDetail.Category?.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="排序权重">{{ currentDetail.sort }}</el-descriptions-item>
          <el-descriptions-item label="库存">{{ currentDetail.stock }}</el-descriptions-item>
          <el-descriptions-item label="上架状态">
            <el-tag :type="currentDetail.status === 1 ? 'success' : 'danger'" size="mini">
              {{ currentDetail.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <h4 class="detail-section-title">商品描述</h4>
        <p class="detail-text">{{ currentDetail.description || '暂无描述' }}</p>

        <h4 class="detail-section-title">商品标签</h4>
        <div>
          <el-tag v-for="tag in currentDetail.tags" :key="tag" style="margin-right:6px">{{ tag }}</el-tag>
          <span v-if="!currentDetail.tags?.length" class="detail-empty">暂无标签</span>
        </div>

        <h4 class="detail-section-title">商品图片</h4>
        <div class="detail-images">
          <el-image
            v-for="(img, idx) in currentDetail.images"
            :key="idx"
            :src="img.url"
            class="detail-image-item"
            :preview-src-list="(currentDetail.images || []).map(i => i.url)"
            fit="cover"
          />
          <span v-if="!currentDetail.images?.length" class="detail-empty">暂无图片</span>
        </div>

        <h4 class="detail-section-title">商品规格</h4>
        <el-table :data="currentDetail.specs || []" size="small" border v-if="currentDetail.specs?.length">
          <el-table-column prop="name" label="规格名" />
          <el-table-column prop="value" label="规格值" />
          <el-table-column prop="price" label="加价" />
          <el-table-column prop="stock" label="库存" />
        </el-table>
        <p v-if="!currentDetail.specs?.length" class="detail-empty">暂无规格</p>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import FilterBar from "../../components/FilterBar.vue";
import FilterBarItem from "../../components/FilterBarItem.vue";
import {
  getProductList,
  createProduct,
  updateProduct,
  deleteProduct,
  getGoodsCategory,
  uploadFiles,
} from "../../api";

export default {
  name: "GoodsList",
  components: { FilterBar, FilterBarItem },
  data() {
    return {
      tableData: [],
      total: 0,
      isVisible: false,
      modalType: 0,
      form: {
        id: "",
        name: "",
        description: "",
        brand: "",
        category_id: "",
        tags: [],
        price: "",
        stock: 0,
        sort: 0,
        status: 1,
        images: [],
        specs: [],
      },
      queryParam: {
        page: 1,
        limit: 10,
        name: "",
        category_id: "",
        brand: "",
        price_min: "",
        price_max: "",
        status: "",
        tags: [],
        sortField: "",
        sortOrder: "",
      },
      formRules: {
        name: [{ required: true, message: "商品名称不能为空", trigger: "blur" }],
        price: [{ required: true, message: "商品价格不能为空", trigger: "blur" }],
        category_id: [{ required: true, message: "请选择商品分类", trigger: "change" }],
        sort: [{ required: true, message: "排序不能为空", trigger: "blur" }],
        stock: [{ required: true, message: "库存不能为空", trigger: "blur" }],
      },
      categoryList: [],
      isUploading: false,
      selectedIds: [],
      detailVisible: false,
      currentDetail: {},
      tagOptions: ["新品", "热销", "推荐", "礼品", "夏季", "经典"],
    };
  },
  computed: {
    uploadFileList() {
      return this.form.images.map((img, i) => ({
        name: `image-${i + 1}`,
        url: img.url,
      }));
    },
  },
  watch: {
    $route: {
      handler(to) {
        if (to.query.category_id) {
          this.queryParam.category_id = Number(to.query.category_id)
          this.queryParam.page = 1
          this.getList()
        }
      },
      immediate: true
    }
  },
  async created() {
    this.defaultForm = JSON.parse(JSON.stringify(this.form));
    this.getList();
    const res = await getGoodsCategory();
    this.categoryList = res.list || [];
  },
  activated() {
    this.getList();
  },
  methods: {
    async getList() {
      const params = { ...this.queryParam }
      Object.keys(params).forEach(k => {
        if (params[k] === '' || params[k] === null || params[k] === undefined) delete params[k]
        if (Array.isArray(params[k]) && !params[k].length) delete params[k]
      })
      if (params.tags) params.tags = params.tags.join(',')
      const res = await getProductList(params);
      this.tableData = res.list;
      this.total = res.total;
    },
    handleCurrentChange(currentPageNum) {
      this.queryParam.page = currentPageNum;
      this.getList();
    },
    handleQuery() {
      this.queryParam.page = 1;
      this.getList();
    },
    handleReset() {
      this.queryParam = {
        page: 1,
        limit: 10,
        name: "",
        category_id: this.$route.query.category_id || "",
        brand: "",
        price_min: "",
        price_max: "",
        status: "",
        tags: [],
        sortField: "",
        sortOrder: "",
      }
      this.getList();
    },
    handleSelectionChange(rows) {
      this.selectedIds = rows.map(r => r.id)
    },
    handleSortChange({ prop, order }) {
      this.queryParam.sortField = prop || ""
      this.queryParam.sortOrder = order || ""
      this.queryParam.page = 1
      this.getList()
    },
    handleDelete(ids) {
      if (!Array.isArray(ids)) ids = [ids.id]
      if (!ids.length) return
      this.$confirm(`确定删除选中的 ${ids.length} 个商品?`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          deleteProduct({ ids }).then(() => {
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
    handleDetail(row) {
      this.currentDetail = row
      this.detailVisible = true
    },
    handleEdit(row) {
      this.isVisible = true;
      this.modalType = 1;
      const clone = JSON.parse(JSON.stringify(row));
      clone.images = (row.images || []).map((img, i) => ({
        url: img.url,
        sort: img.sort || i + 1,
        type: img.type || (i === 0 ? "main" : "carousel"),
      }));
      this.form = clone;
    },
    handleAdd() {
      this.isVisible = true;
      this.modalType = 0;
    },
    async submit() {
      await this.$refs.form.validate();
      const payload = { ...this.form };
      if (this.modalType === 0) {
        delete payload.id;
        delete payload.Category;
        delete payload.createdAt;
        delete payload.updatedAt;
        await createProduct(payload);
        this.getList();
      } else {
        delete payload.Category;
        delete payload.createdAt;
        delete payload.updatedAt;
        await updateProduct(payload);
        this.getList();
      }
      this.handleClose();
      this.$message({
        type: "success",
        message: this.modalType === 0 ? "添加成功" : "编辑成功",
      });
    },
    handleClose() {
      this.form = JSON.parse(JSON.stringify(this.defaultForm));
      this.isVisible = false;
      this.$refs.form.clearValidate();
    },
    async handleUploadFile({ file }) {
      this.isUploading = true;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("directory", "product");
      const res = await uploadFiles(formData);
      this.isUploading = false;
      this.form.images.push({
        url: res.url,
        sort: this.form.images.length + 1,
        type: this.form.images.length === 0 ? "main" : "carousel",
      });
      this.$refs.uploadRef.clearFiles();
    },
    handleRemove(file, fileList) {
      this.form.images = fileList.map((f, i) => ({
        url: f.url,
        sort: i + 1,
        type: i === 0 ? "main" : "carousel",
      }));
    },
    addSpec() {
      this.form.specs.push({ name: "", value: "", price: 0, stock: 0 });
    },
    removeSpec(index) {
      this.form.specs.splice(index, 1);
    },
  },
};
</script>

<style scoped lang="scss">
.filter-price {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
}
.filter-price .el-input {
  flex: 1;
  min-width: 0;
}
.filter-price .line {
  text-align: center;
  color: #b6b6b6;
}
.spec-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}
.drawer-body {
  padding: 0 20px 20px;
}
.detail-section-title {
  margin: 20px 0 10px;
  font-size: 15px;
  color: #333;
}
.detail-text {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}
.detail-empty {
  color: #999;
  font-size: 13px;
}
.detail-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.detail-image-item {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}
</style>

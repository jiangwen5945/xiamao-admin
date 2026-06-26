<template>
  <div class="page">
    <!-- 顶部统计卡片：展示商品总数、库存总量、库存不足、缺货数量 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value">{{ stats.total_products }}</div>
        <div class="stat-label">商品总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.total_stock }}</div>
        <div class="stat-label">库存总量</div>
      </div>
      <div class="stat-card warn">
        <div class="stat-value">{{ stats.low_stock_count }}</div>
        <div class="stat-label">库存不足（≤10）</div>
      </div>
      <div class="stat-card danger">
        <div class="stat-value">{{ stats.out_of_stock_count }}</div>
        <div class="stat-label">缺货</div>
      </div>
    </div>

    <!-- 筛选栏：按商品名称、分类、库存状态过滤 -->
    <FilterBar @query="handleQuery" @reset="handleReset">
      <FilterBarItem label="商品名称">
        <el-input v-model="queryParam.product_name" placeholder="" clearable @keyup.enter="handleQuery" />
      </FilterBarItem>
      <FilterBarItem label="分类">
        <el-select v-model="queryParam.category_id" placeholder="全部" clearable filterable>
          <el-option v-for="item in categoryList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </FilterBarItem>
      <FilterBarItem label="库存状态">
        <el-select v-model="queryParam.stock_status" placeholder="全部" clearable>
          <el-option label="正常" value="normal" />
          <el-option label="库存不足" value="low" />
          <el-option label="缺货" value="out" />
        </el-select>
      </FilterBarItem>
    </FilterBar>

    <!-- 库存列表表格 -->
    <div class="table-content">
      <el-table :data="tableData" stripe @sort-change="handleSortChange">
        <!-- 商品名称（点击查看详情） -->
        <el-table-column label="商品名称"  width="180">
          <template #default="scope">
            <el-link type="primary" :underline="false" @click="handleDetail(scope.row)">
              {{ scope.row.Product?.name }}
            </el-link>
          </template>
        </el-table-column>
        <!-- 商品首图 -->
        <el-table-column label="图片">
          <template #default="scope">
            <el-image
              :src="scope.row.Product?.images?.[0]?.url"
              style="width:48px;height:48px;object-fit:cover;border-radius:4px"
              :preview-src-list="(scope.row.Product?.images || []).map(i => i.url)"
              fit="cover"
            />
          </template>
        </el-table-column>
        <el-table-column prop="product_id" label="编号" />
        <!-- 价格（带 ¥ 前缀） -->
        <el-table-column label="价格" >
          <template #default="scope">
            ¥{{ scope.row.Product?.price }}
          </template>
        </el-table-column>
        <!-- 分类名称 -->
        <el-table-column label="分类" >
          <template #default="scope">
            {{ scope.row.Product?.Category?.name || '-' }}
          </template>
        </el-table-column>
        <!-- 当前库存（支持排序），根据数量显示不同颜色 -->
        <el-table-column prop="quantity" label="当前库存" sortable="custom">
          <template #default="scope">
            <span :class="stockClass(scope.row.quantity)">{{ scope.row.quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="locked_quantity" label="锁定库存" />
        <el-table-column prop="sales_count" label="累计销量" sortable="custom" />
        <!-- 库存状态标签：缺货/不足/正常 -->
        <el-table-column label="库存状态">
          <template #default="scope">
            <el-tag v-if="scope.row.quantity === 0" type="danger" size="mini">缺货</el-tag>
            <el-tag v-else-if="scope.row.quantity <= 10" type="warning" size="mini">不足</el-tag>
            <el-tag v-else type="success" size="mini">正常</el-tag>
          </template>
        </el-table-column>
        <!-- 上架状态标签 -->
        <el-table-column label="上架状态" >
          <template #default="scope">
            <el-tag :type="scope.row.Product?.status === 1 ? 'success' : 'danger'" size="mini">
              {{ scope.row.Product?.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <!-- 操作按钮：入库、盘点、变动记录 -->
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <el-button size="mini" type="primary" @click="handleInbound(scope.row)">入库</el-button>
            <el-button size="mini" @click="handleAdjust(scope.row)">盘点</el-button>
            <el-button size="mini" @click="handleMovements(scope.row)">记录</el-button>
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

    <!-- 入库弹窗：增加指定商品的库存 -->
    <el-dialog
      title="入库"
      :visible="inboundVisible"
      :before-close="handleInboundClose"
      center
      width="500px"
      :destroy-on-close="true"
    >
      <el-form ref="inboundForm" :model="inboundForm" :rules="stockRules" label-width="100px">
        <el-form-item label="商品名称">
          <el-input :value="currentProductName" disabled />
        </el-form-item>
        <el-form-item label="入库数量" prop="quantity">
          <el-input-number v-model="inboundForm.quantity" :min="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="inboundForm.remark" type="textarea" :rows="3" placeholder="入库备注" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleInboundClose">取 消</el-button>
        <el-button type="primary" @click="submitInbound">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 盘点调整弹窗：修正实际库存与系统库存的差异 -->
    <el-dialog
      title="盘点调整"
      :visible="adjustVisible"
      :before-close="handleAdjustClose"
      center
      width="500px"
      :destroy-on-close="true"
    >
      <el-form ref="adjustForm" :model="adjustForm" :rules="stockRules" label-width="100px">
        <el-form-item label="商品名称">
          <el-input :value="currentProductName" disabled />
        </el-form-item>
        <el-form-item label="当前库存">
          <el-input :value="currentQuantity" disabled />
        </el-form-item>
        <el-form-item label="调整后数量" prop="quantity">
          <el-input-number v-model="adjustForm.quantity" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="adjustForm.remark" type="textarea" :rows="3" placeholder="盘点备注" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleAdjustClose">取 消</el-button>
        <el-button type="primary" @click="submitAdjust">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 变动记录弹窗：查看该商品的库存进出明细 -->
    <el-dialog
      title="库存变动记录"
      :visible="movementVisible"
      :before-close="handleMovementClose"
      center
      width="900px"
      :destroy-on-close="true"
    >
      <el-table :data="movementData" stripe size="small">
        <el-table-column label="商品" min-width="150">
          <template #default="scope">
            <div class="movement-product">
              <el-image
                :src="scope.row.Product?.images?.[0]?.url"
                style="width:32px;height:32px;object-fit:cover;border-radius:4px;margin-right:8px"
                fit="cover"
              />
              <span>{{ scope.row.Product?.name }}</span>
            </div>
          </template>
        </el-table-column>
        <!-- 变动类型：入库/出库/调整/订单扣减/取消归还 -->
        <el-table-column prop="type" label="类型" width="100">
          <template #default="scope">
            <el-tag :type="typeTagType(scope.row.type)" size="mini">{{ typeLabel(scope.row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="before_quantity" label="变动前" width="70" />
        <!-- 变动数量：正数（绿色）/负数（红色） -->
        <el-table-column label="变动数量" width="80">
          <template #default="scope">
            <span :style="{ color: scope.row.quantity > 0 ? '#67c23a' : '#f56c6c' }">
              {{ scope.row.quantity > 0 ? `+${scope.row.quantity}` : scope.row.quantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="after_quantity" label="变动后" width="70" />
        <el-table-column prop="operator" label="操作人" width="100" />
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column prop="created_at" label="时间" width="160">
          <template #default="scope">
            {{ scope.row.created_at || '-' }}
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        layout="total, prev, pager, next"
        :total="movementTotal"
        :page-size="movementPageSize"
        :current-page.sync="movementPage"
        class="pagination"
        @current-change="handleMovementPageChange"
      />
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      :visible.sync="detailVisible"
      title="库存详情"
      size="550px"
      :destroy-on-close="true"
    >
      <div class="drawer-body" v-if="currentDetail.product_id">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="商品名称">{{ currentDetail.Product?.name }}</el-descriptions-item>
          <el-descriptions-item label="商品编号">{{ currentDetail.product_id }}</el-descriptions-item>
          <el-descriptions-item label="价格">¥{{ currentDetail.Product?.price }}</el-descriptions-item>
          <el-descriptions-item label="分类">{{ currentDetail.Product?.Category?.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="当前库存">{{ currentDetail.quantity }}</el-descriptions-item>
          <el-descriptions-item label="锁定库存">{{ currentDetail.locked_quantity }}</el-descriptions-item>
          <el-descriptions-item label="累计销量">{{ currentDetail.sales_count }}</el-descriptions-item>
          <el-descriptions-item label="库存状态">
            <el-tag v-if="currentDetail.quantity === 0" type="danger" size="mini">缺货</el-tag>
            <el-tag v-else-if="currentDetail.quantity <= 10" type="warning" size="mini">不足</el-tag>
            <el-tag v-else type="success" size="mini">正常</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="上架状态">
            <el-tag :type="currentDetail.Product?.status === 1 ? 'success' : 'danger'" size="mini">
              {{ currentDetail.Product?.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <h4 class="detail-section-title">商品图片</h4>
        <div class="detail-images">
          <el-image
            v-for="(img, idx) in currentDetail.Product?.images"
            :key="idx"
            :src="img.url"
            class="detail-image-item"
            :preview-src-list="(currentDetail.Product?.images || []).map(i => i.url)"
            fit="cover"
          />
          <span v-if="!currentDetail.Product?.images?.length" class="detail-empty">暂无图片</span>
        </div>

        <h4 class="detail-section-title">商品规格</h4>
        <el-table :data="currentDetail.Product?.specs || []" size="small" border v-if="currentDetail.Product?.specs?.length">
          <el-table-column prop="name" label="规格名" />
          <el-table-column prop="value" label="规格值" />
          <el-table-column prop="price" label="加价" />
          <el-table-column prop="stock" label="库存" />
        </el-table>
        <p v-if="!currentDetail.Product?.specs?.length" class="detail-empty">暂无规格</p>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import FilterBar from "@/components/filter/FilterBar";
import FilterBarItem from "@/components/filter/FilterBarItem";

/** 默认查询参数 */
const QUERY_PARAM = {
  page: 1,
  pageSize: 10,
  product_name: '',
  category_id: '',
  stock_status: '',
}

export default {
  name: "StockList",
  components: { FilterBar, FilterBarItem },
  data() {
    return {
      tableData: [],            // 库存列表数据
      total: 0,                 // 总条目数
      queryParam: { ...QUERY_PARAM }, // 查询参数
      stats: {                  // 顶部统计卡片
        total_products: 0,
        total_stock: 0,
        low_stock_count: 0,
        out_of_stock_count: 0,
      },
      categoryList: [],         // 分类选项列表

      // 入库弹窗
      inboundVisible: false,
      inboundForm: { product_id: '', quantity: 1, remark: '' },
      // 盘点调整弹窗
      adjustVisible: false,
      adjustForm: { product_id: '', quantity: 0, remark: '' },
      currentProductName: '',   // 当前操作的商品名称
      currentQuantity: 0,       // 当前操作的商品库存
      currentRow: null,         // 当前操作的行数据

      // 变动记录弹窗
      movementVisible: false,
      movementData: [],
      movementTotal: 0,
      movementPage: 1,
      movementPageSize: 10,

      // 详情抽屉
      detailVisible: false,
      currentDetail: {},

      // 表单校验规则
      stockRules: {
        quantity: [{ required: true, message: '数量不能为空', trigger: 'blur' }],
      },
    };
  },
  async created() {
    this.getStats()             // 获取统计概览
    this.getList()              // 获取库存列表
    const res = await this.$api.getGoodsCategory()
    this.categoryList = res.list || []
  },
  /** keep-alive 激活时刷新列表 */
  activated() {
    this.getList()
  },
  methods: {
    /** 获取顶部统计卡片数据 */
    async getStats() {
      const res = await this.$api.getStockStats()
      this.stats = res || this.stats
    },
    /** 获取库存分页列表 */
    async getList() {
      const params = { ...this.queryParam }
      const res = await this.$api.getStockList(params)
      this.tableData = res && res.list
      this.total = res.total
    },
    /** 分页切换 */
    handleCurrentChange(currentPageNum) {
      this.queryParam.page = currentPageNum
      this.getList()
    },
    /** 搜索查询（重置到第一页） */
    handleQuery() {
      this.queryParam.page = 1
      this.getList()
    },
    /** 重置筛选条件 */
    handleReset() {
      this.queryParam = { ...QUERY_PARAM }
      this.getList()
    },
    /** 表格排序变化 */
    handleSortChange({ prop, order }) {
      this.queryParam.sortField = prop || ""
      this.queryParam.sortOrder = order || ""
      this.queryParam.page = 1
      this.getList()
    },
    /** 根据库存数量返回对应的 CSS 类名 */
    stockClass(quantity) {
      if (quantity === 0) return 'stock-out'
      if (quantity <= 10) return 'stock-low'
      return 'stock-normal'
    },

    /** 打开商品库存详情抽屉 */
    handleDetail(row) {
      this.$api.getStockDetail({ product_id: row.product_id }).then(res => {
        this.currentDetail = res
        this.detailVisible = true
      })
    },

    /** 打开入库弹窗 */
    handleInbound(row) {
      this.currentRow = row
      this.currentProductName = row.Product?.name
      this.inboundForm = { product_id: row.product_id, quantity: 1, remark: '' }
      this.inboundVisible = true
    },
    /** 关闭入库弹窗并重置校验 */
    handleInboundClose() {
      this.inboundVisible = false
      this.$refs.inboundForm?.clearValidate()
    },
    /** 提交入库 */
    async submitInbound() {
      await this.$refs.inboundForm.validate()
      await this.$api.inboundStock(this.inboundForm)
      this.$message({ type: 'success', message: '入库成功' })
      this.handleInboundClose()
      this.getList()
      this.getStats()
    },

    /** 打开盘点调整弹窗 */
    handleAdjust(row) {
      this.currentRow = row
      this.currentProductName = row.Product?.name
      this.currentQuantity = row.quantity
      this.adjustForm = { product_id: row.product_id, quantity: row.quantity, remark: '' }
      this.adjustVisible = true
    },
    /** 关闭盘点弹窗并重置校验 */
    handleAdjustClose() {
      this.adjustVisible = false
      this.$refs.adjustForm?.clearValidate()
    },
    /** 提交盘点调整 */
    async submitAdjust() {
      await this.$refs.adjustForm.validate()
      await this.$api.adjustStock(this.adjustForm)
      this.$message({ type: 'success', message: '调整成功' })
      this.handleAdjustClose()
      this.getList()
      this.getStats()
    },

    /** 打开变动记录弹窗 */
    async handleMovements(row) {
      this.movementPage = 1
      this.currentRow = row
      this.currentProductName = row.Product?.name
      await this.loadMovements(row.product_id)
      this.movementVisible = true
    },
    /** 关闭变动记录弹窗 */
    handleMovementClose() {
      this.movementVisible = false
    },
    /** 变动记录分页切换 */
    handleMovementPageChange(page) {
      this.movementPage = page
      this.loadMovements(this.currentRow?.product_id)
    },
    /** 加载变动记录数据 */
    async loadMovements(product_id) {
      const res = await this.$api.getStockMovements({
        product_id,
        page: this.movementPage,
        pageSize: this.movementPageSize,
      })
      this.movementData = res.list
      this.movementTotal = res.total
    },
    /** 变动类型对应的标签颜色 */
    typeTagType(type) {
      const map = { in: 'success', out: 'danger', adjust: 'warning', order_out: 'danger', cancel_return: 'info' }
      return map[type] || 'info'
    },
    /** 变动类型的中文名称 */
    typeLabel(type) {
      const map = { in: '入库', out: '出库', adjust: '调整', order_out: '订单扣减', cancel_return: '取消归还' }
      return map[type] || type
    },
  },
};
</script>

<style scoped lang="scss">
/* 顶部统计卡片网格布局 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
/* 统计卡片样式 */
.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border-left: 4px solid #409eff; /* 默认蓝色边框 */
}
/* 库存不足警告色 */
.stat-card.warn {
  border-left-color: #e6a23c;
}
/* 缺货危险色 */
.stat-card.danger {
  border-left-color: #f56c6c;
}
/* 统计数字 */
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
}
/* 统计标签 */
.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 6px;
}
/* 缺货数量文本 */
.stock-out {
  color: #f56c6c;
  font-weight: 600;
}
/* 库存不足数量文本 */
.stock-low {
  color: #e6a23c;
  font-weight: 600;
}
/* 库存正常数量文本 */
.stock-normal {
  color: #67c23a;
}
/* 详情抽屉内边距 */
.drawer-body {
  padding: 0 20px 20px;
}
/* 详情区域小标题 */
.detail-section-title {
  margin: 20px 0 10px;
  font-size: 15px;
  color: #333;
}
/* 空状态提示 */
.detail-empty {
  color: #999;
  font-size: 13px;
}
/* 商品图片平铺 */
.detail-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
/* 详情图片项 */
.detail-image-item {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}
/* 变动记录中商品信息行 */
.movement-product {
  display: flex;
  align-items: center;
}
</style>

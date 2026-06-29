<template>
  <div class="page">
    <FilterBar @query="handleQuery" @reset="handleReset">
      <FilterBarItem label="商品名称">
        <el-input v-model="queryParam.product_name" placeholder="" clearable @keyup.enter="handleQuery" />
      </FilterBarItem>
      <FilterBarItem label="评分">
        <el-select v-model="queryParam.rating" placeholder="全部" clearable>
          <el-option v-for="r in 5" :key="r" :label="r + ' 星'" :value="r" />
        </el-select>
      </FilterBarItem>
      <FilterBarItem label="状态">
        <el-select v-model="queryParam.status" placeholder="全部" clearable>
          <el-option label="显示" :value="1" />
          <el-option label="隐藏" :value="0" />
        </el-select>
      </FilterBarItem>
    </FilterBar>

    <div class="table-header">
      <div class="left">
        <el-button type="danger" size="medium" :disabled="!selectedIds.length" @click="handleDelete(selectedIds)">批量删除</el-button>
      </div>
    </div>

    <div class="table-content">
      <el-table :data="tableData" stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="45" />
        <el-table-column label="商品信息" min-width="180">
          <template #default="scope">
            <div class="product-info-cell">
              <el-image
                :src="scope.row.Product?.images?.[0]?.url"
                style="width:40px;height:40px;object-fit:cover;border-radius:4px;flex-shrink:0"
                fit="cover"
              />
              <el-link type="primary" :underline="false" class="product-name" @click="handleDetail(scope.row)">
                {{ scope.row.Product?.name || '-' }}
              </el-link>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="会员" width="120">
          <template #default="scope">
            {{ scope.row.Member?.nickname || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="评分" width="140">
          <template #default="scope">
            <el-rate v-model="scope.row.rating" disabled show-score text-color="#ff9900" score-template="{value}" />
          </template>
        </el-table-column>
        <el-table-column label="评价内容" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            {{ scope.row.content || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="回复" width="80">
          <template #default="scope">
            <el-tag v-if="scope.row.reply" type="success" size="mini">已回复</el-tag>
            <el-tag v-else type="info" size="mini">未回复</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="mini">
              {{ scope.row.status === 1 ? '显示' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="评价时间" width="160">
          <template #default="scope">
            {{ dayjs(scope.row.createdAt).format('YYYY-MM-DD HH:mm') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button size="mini" @click="handleReply(scope.row)">回复</el-button>
            <el-button
              size="mini"
              :type="scope.row.status === 1 ? 'warning' : 'success'"
              @click="handleToggleStatus(scope.row)"
            >
              {{ scope.row.status === 1 ? '隐藏' : '显示' }}
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

    <!-- 回复弹窗 -->
    <el-dialog
      title="回复评价"
      :visible.sync="replyVisible"
      width="600px"
      :destroy-on-close="true"
    >
      <div v-if="replyTarget" class="reply-review-content">
        <div class="reply-review-meta">
          <span class="reply-label">商品：</span>{{ replyTarget.Product?.name }}
          <el-rate v-model="replyTarget.rating" disabled show-score text-color="#ff9900" class="reply-rate" score-template="{value}" />
        </div>
        <div class="reply-review-text">{{ replyTarget.content }}</div>
        <div v-if="replyTarget.reply" class="reply-existed">
          <div class="reply-existed-label">历史回复：</div>
          <div class="reply-existed-text">{{ replyTarget.reply }}</div>
        </div>
      </div>
      <el-input
        type="textarea"
        v-model="replyForm.reply"
        :rows="4"
        placeholder="请输入回复内容"
        maxlength="500"
        show-word-limit
      />
      <div slot="footer" class="dialog-footer">
        <el-button @click="replyVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitReply" :disabled="!replyForm.reply.trim()">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 评价详情抽屉 -->
    <el-drawer
      :visible.sync="detailVisible"
      title="评价详情"
      size="600px"
      :destroy-on-close="true"
    >
      <div class="drawer-body" v-if="currentDetail.id">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="商品名称">{{ currentDetail.Product?.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="会员昵称">{{ currentDetail.Member?.nickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="评分">
            <el-rate v-model="currentDetail.rating" disabled show-score text-color="#ff9900" score-template="{value}" />
          </el-descriptions-item>
          <el-descriptions-item label="评价时间">{{ dayjs(currentDetail.createdAt).format('YYYY-MM-DD HH:mm') }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentDetail.status === 1 ? 'success' : 'danger'" size="mini">
              {{ currentDetail.status === 1 ? '显示' : '隐藏' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <h4 class="detail-section-title">评价内容</h4>
        <p class="detail-text">{{ currentDetail.content || '暂无内容' }}</p>

        <h4 class="detail-section-title" v-if="currentDetail.images?.length">评价图片</h4>
        <div class="detail-images" v-if="currentDetail.images?.length">
          <el-image
            v-for="(img, idx) in currentDetail.images"
            :key="idx"
            :src="img.url"
            class="detail-image-item"
            :preview-src-list="(currentDetail.images || []).map(i => i.url)"
            fit="cover"
          />
        </div>

        <h4 class="detail-section-title" v-if="currentDetail.reply">商家回复</h4>
        <div class="detail-reply" v-if="currentDetail.reply">
          <p>{{ currentDetail.reply }}</p>
          <span class="detail-reply-time">{{ dayjs(currentDetail.reply_time).format('YYYY-MM-DD HH:mm') }}</span>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import FilterBar from "@/components/filter/FilterBar";
import FilterBarItem from "@/components/filter/FilterBarItem";
import dayjs from "dayjs";

const QUERY_PARAM = {
  page: 1,
  pageSize: 10,
  product_name: '',
  rating: '',
  status: '',
}

export default {
  name: "ProductReview",
  components: { FilterBar, FilterBarItem },
  data() {
    return {
      tableData: [],
      total: 0,
      queryParam: { ...QUERY_PARAM },
      selectedIds: [],
      detailVisible: false,
      currentDetail: {},
      replyVisible: false,
      replyTarget: null,
      replyForm: {
        id: null,
        reply: '',
      },
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
      const params = { ...this.queryParam }
      Object.keys(params).forEach(k => {
        if (params[k] === '' || params[k] === null || params[k] === undefined) delete params[k]
      })
      const res = await this.$api.getReviewList(params);
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
      this.queryParam = { ...QUERY_PARAM }
      this.getList()
    },
    handleSelectionChange(rows) {
      this.selectedIds = rows.map(r => r.id)
    },
    async handleDetail(row) {
      const res = await this.$api.getReviewDetail({ id: row.id })
      this.currentDetail = res
      this.detailVisible = true
    },
    handleReply(row) {
      this.replyTarget = row
      this.replyForm.id = row.id
      this.replyForm.reply = row.reply || ''
      this.replyVisible = true
    },
    async submitReply() {
      await this.$api.replyReview({ id: this.replyForm.id, reply: this.replyForm.reply })
      this.$message({ type: 'success', message: '回复成功' })
      this.replyVisible = false
      this.getList()
    },
    async handleToggleStatus(row) {
      const newStatus = row.status === 1 ? 0 : 1
      await this.$api.updateReviewStatus({ id: row.id, status: newStatus })
      this.$message({ type: 'success', message: newStatus === 1 ? '已显示' : '已隐藏' })
      this.getList()
    },
    handleDelete(ids) {
      if (!ids.length) return
      this.$confirm(`确定删除选中的 ${ids.length} 个评价?`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.$api.deleteReview({ ids }).then(() => {
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
.product-info-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.product-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.reply-review-content {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
}
.reply-review-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #666;
}
.reply-label {
  color: #999;
}
.reply-rate {
  display: inline-flex;
  margin-left: auto;
}
.reply-review-text {
  color: #333;
  font-size: 14px;
  line-height: 1.6;
}
.reply-existed {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e4e7ed;
}
.reply-existed-label {
  font-size: 13px;
  color: #999;
  margin-bottom: 4px;
}
.reply-existed-text {
  color: #333;
  font-size: 14px;
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
.detail-reply {
  background: #f0f9eb;
  border-radius: 6px;
  padding: 12px;
  p {
    color: #333;
    font-size: 14px;
    line-height: 1.6;
    margin: 0 0 4px;
  }
}
.detail-reply-time {
  color: #999;
  font-size: 12px;
}
</style>

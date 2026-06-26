<template>
  <div class="page">
    <FilterBar @query="handleQuery" @reset="handleReset">
      <FilterBarItem label="标题">
        <el-input
          v-model="queryParam.title"
          placeholder=""
          clearable
          @keyup.enter="handleQuery"
        />
      </FilterBarItem>
      <FilterBarItem label="接收类型">
        <el-select v-model="queryParam.receiver_type" placeholder="全部" clearable>
          <el-option label="管理员" value="admin" />
          <el-option label="会员" value="member" />
        </el-select>
      </FilterBarItem>
      <FilterBarItem label="状态">
        <el-select v-model="queryParam.is_read" placeholder="全部" clearable>
          <el-option label="已读" :value="1" />
          <el-option label="未读" :value="0" />
        </el-select>
      </FilterBarItem>
    </FilterBar>

    <div class="table-header">
      <div class="left">
        <el-button type="primary" size="medium" @click="handleSend"
          >发送消息</el-button
        >
        <el-button
          type="success"
          size="medium"
          :disabled="!selectedIds.length"
          @click="handleMarkRead(selectedIds)"
          >标记已读</el-button
        >
      </div>
    </div>

    <div class="table-content">
      <el-table
        :data="tableData"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="45" />
        <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
        <el-table-column label="接收类型" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.receiver_type === 'admin' ? 'primary' : 'success'" size="mini">
              {{ scope.row.receiver_type === 'admin' ? '管理员' : '会员' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="receiver_id" label="接收者ID" width="80" />
        <el-table-column label="状态" width="80">
          <template #default="scope">
            <el-tag
              :type="scope.row.is_read === 1 ? 'info' : 'warning'"
              size="mini"
            >
              {{ scope.row.is_read === 1 ? "已读" : "未读" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发送方式" width="80">
          <template #default="scope">
            {{ scope.row.template_id ? '模板' : '直接' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="发送时间" width="180">
          <template #default="scope">
            {{ scope.row.createdAt | dateTime }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button size="mini" @click="handleDetail(scope.row)">详情</el-button>
            <el-button
              size="mini"
              type="success"
              :disabled="scope.row.is_read === 1"
              @click="handleMarkRead([scope.row.id])"
            >
              {{ scope.row.is_read === 1 ? "已读" : "标为已读" }}
            </el-button>
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

    <el-dialog
      title="发送站内信"
      :visible="sendVisible"
      :before-close="handleSendClose"
      center
      :destroy-on-close="true"
    >
      <el-form ref="sendForm" :model="sendForm" :rules="sendFormRules" label-width="100px">
        <el-form-item label="使用模板">
          <el-select
            v-model="sendForm.template_id"
            placeholder="选择模板（可选）"
            clearable
            filterable
            @change="handleTemplateChange"
          >
            <el-option
              v-for="tpl in templateOptions"
              :key="tpl.id"
              :label="tpl.name"
              :value="tpl.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="sendForm.title" placeholder="请输入消息标题" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="sendForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入消息内容"
          />
        </el-form-item>
        <el-form-item label="接收类型" prop="receiver_type">
          <el-select v-model="sendForm.receiver_type" placeholder="请选择">
            <el-option label="管理员" value="admin" />
            <el-option label="会员" value="member" />
          </el-select>
        </el-form-item>
        <el-form-item label="接收者ID" prop="receiver_ids">
          <el-input
            v-model="sendForm.receiver_ids"
            placeholder="多个 ID 用逗号分隔"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleSendClose">取 消</el-button>
        <el-button type="primary" @click="handleSendSubmit">发 送</el-button>
      </div>
    </el-dialog>

    <el-drawer
      :visible.sync="detailVisible"
      title="消息详情"
      size="520px"
      :destroy-on-close="true"
    >
      <div class="drawer-body" v-if="currentDetail.id">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="标题">{{ currentDetail.title }}</el-descriptions-item>
          <el-descriptions-item label="内容">{{ currentDetail.content }}</el-descriptions-item>
          <el-descriptions-item label="接收类型">
            <el-tag :type="currentDetail.receiver_type === 'admin' ? 'primary' : 'success'" size="mini">
              {{ currentDetail.receiver_type === 'admin' ? '管理员' : '会员' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="接收者ID">{{ currentDetail.receiver_id }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag
              :type="currentDetail.is_read === 1 ? 'info' : 'warning'"
              size="mini"
            >
              {{ currentDetail.is_read === 1 ? "已读" : "未读" }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.read_at" label="阅读时间">
            {{ currentDetail.read_at | dateTime }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.template_id" label="关联模板ID">
            {{ currentDetail.template_id }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.sender_id" label="发送者ID">
            {{ currentDetail.sender_id }}
          </el-descriptions-item>
          <el-descriptions-item label="发送时间">{{ currentDetail.createdAt | dateTime }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import FilterBar from "@/components/filter/FilterBar.vue";
import FilterBarItem from "@/components/filter/FilterBarItem";
import dayjs from "dayjs";

const QUERY_PARAM = {
  page: 1,
  pageSize: 10,
  title: "",
  receiver_type: "",
  is_read: "",
};
const createDefaultSendForm = () => ({
  template_id: "",
  title: "",
  content: "",
  receiver_type: "admin",
  receiver_ids: "",
});

export default {
  name: "SiteMessageList",
  components: { FilterBar, FilterBarItem },
  filters: {
    dateTime(val) {
      return dayjs(val).format("YYYY-MM-DD HH:mm");
    },
  },
  data() {
    return {
      tableData: [],
      total: 0,
      queryParam: { ...QUERY_PARAM },
      selectedIds: [],
      detailVisible: false,
      currentDetail: {},

      sendVisible: false,
      sendForm: createDefaultSendForm(),
      sendFormRules: {
        title: [
          { required: true, message: "标题不能为空", trigger: "blur" },
        ],
        receiver_type: [
          { required: true, message: "请选择接收类型", trigger: "change" },
        ],
        receiver_ids: [
          { required: true, message: "请输入接收者ID", trigger: "blur" },
        ],
      },
      templateOptions: [],
    };
  },

  async created() {
    this.getList();
    this.getTemplates();
  },
  activated() {
    this.getList();
  },
  methods: {
    async getList() {
      const params = { ...this.queryParam };
      Object.keys(params).forEach((k) => {
        if (params[k] === "" || params[k] === null || params[k] === undefined)
          delete params[k];
        if (Array.isArray(params[k]) && !params[k].length) delete params[k];
      });
      const res = await this.$api.getSiteMessageList(params);
      this.tableData = res.list;
      this.total = res.total;
    },
    async getTemplates() {
      const res = await this.$api.getNotificationTemplateList({ page: 1, pageSize: 999 });
      this.templateOptions = res.list || [];
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
      this.queryParam = { ...QUERY_PARAM };
      this.getList();
    },
    handleSelectionChange(rows) {
      this.selectedIds = rows.map((r) => r.id);
    },
    handleMarkRead(ids) {
      if (!ids.length) return;
      this.$api.markSiteMessageRead({ ids }).then(() => {
        this.$message({ type: "success", message: "标记已读成功!" });
        this.selectedIds = [];
        this.getList();
      });
    },
    handleDetail(row) {
      this.currentDetail = row;
      this.detailVisible = true;
    },

    handleSend() {
      this.sendForm = createDefaultSendForm();
      this.sendVisible = true;
    },
    handleTemplateChange(templateId) {
      if (!templateId) return;
      const tpl = this.templateOptions.find((t) => t.id === templateId);
      if (tpl) {
        this.sendForm.title = tpl.title;
        this.sendForm.content = tpl.content;
      }
    },
    async handleSendSubmit() {
      await this.$refs.sendForm.validate();
      const payload = { ...this.sendForm };
      if (!payload.template_id) delete payload.template_id;
      payload.receiver_ids = payload.receiver_ids
        .split(",")
        .map((id) => Number(id.trim()))
        .filter((id) => !isNaN(id) && id > 0);
      await this.$api.sendSiteMessage(payload);
      this.$message({ type: "success", message: "发送成功!" });
      this.handleSendClose();
      this.getList();
      this.$root.$emit("notification-sent");
    },
    handleSendClose() {
      this.sendForm = createDefaultSendForm();
      this.sendVisible = false;
      this.$refs.sendForm.clearValidate();
    },
  },
};
</script>

<style scoped lang="scss">
.drawer-body {
  padding: 0 20px 20px;
}
</style>

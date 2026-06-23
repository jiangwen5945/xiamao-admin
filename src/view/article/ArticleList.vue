<template>
  <div class="page">
    <!-- 头部 -->
    <div class="table-header">
      <div class="left">
        <el-button type="primary" size="medium" @click="toCreatePage(null)">+新增</el-button>
      </div>
      <div class="right">
        <el-input placeholder="请输入查询内容" v-model="queryParam.name"></el-input>
        <el-button type="primary" size="medium" @click="handleQuery" style="margin-left: 10px;">查询</el-button>
      </div>
    </div>

    <!-- 表格内容 -->
    <div class="table-content">
      <el-table :data="tableData" stripe :default-sort="{ prop: 'createTime', order: 'descending' }">
        <el-table-column type="selection" width="55" />
        <!-- 文章ID -->
        <el-table-column prop="id" label="文章编号" sortable></el-table-column>

        <!-- 文章标题 -->
        <el-table-column prop="title" label="文章标题"></el-table-column>

        <!-- 作者 -->
        <el-table-column prop="author" label="作者"></el-table-column>
       
        <!-- 日期 -->
        <el-table-column prop="createTime" label="日期" sortable></el-table-column>
        <!-- 评分 -->
        <el-table-column prop="score" label="评分" sortable>
          <template slot-scope="scope">
            <span v-if="scope.row.score">
              <i class="el-icon-star-on" v-for="item in Number(scope.row.score)" :key="item"></i>
            </span>
            <span v-else>暂无评分</span>
          </template>
        </el-table-column>

        <!-- 状态 -->
        <el-table-column prop="status" label="状态" sortable>
          <template slot-scope="scope">
            <el-switch :active-value="1" :inactive-value="0" v-model="scope.row.status"></el-switch>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="160">
          <template slot-scope="scope">
            <el-button size="mini" @click="toCreatePage(scope.row)">编辑</el-button>
            <el-button type="danger" size="mini" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>


    <!-- 分页 -->
    <el-pagination layout="prev, pager, next" :total="count" class="pagination" @current-change="handleCurrentChange"
      :hide-on-single-page="true">
    </el-pagination>
  </div>
</template>
 
<script>

import { mixins } from "@/mixin";
import rules from '@/utils/rules';
export default {
  name: 'ArticleList',
  mixins: [mixins],
  data() {
    return {
      rules,
      form: {
        id: '',
        fileList: [], // 上传完成文件地址数组（编辑回显时需要）
        category: [],
        title: '',
        price: '',
        label: [],
        sort: '',
        sku: '',
        stock: '',
        sales: '',
        verify: '',
        available: ''
      },
      // 查询参数
      queryParam: {
        page: 1,
        limit: 10,
        title: ''
      }
    };
  },
  methods: {
    // 基础增删改查
    getDataApi() {
      return this.$api.getArticleList(this.queryParam)
    },
    deleteApi(id) {
      return this.$api.deleteArticle(id)
    },
    createApi(data) {
      return this.$api.createArticle(data)
    },
    updateApi(data) {
      return this.$api.updateArticle(data)
    },

    // 分页操作
    async handleCurrentChange(currentPageNum) {
      this.queryParam.page = currentPageNum // 设置请求列表的页数为当前页面数
      this.getData()
    },

    // 查询
    handleQuery() {
      this.getData() //请求列表数据
    },
    toCreatePage(row){
      console.log('params', row);
      // const params = 
      this.$router.push({ path: 'CreateArticle',query:{...row}})
      this.$store.commit('updateNavList', {
        path: '/CreateArticle',
        name: 'CreateArticle',
        label: '创建文章',
        icon: 'edit-outline',
        url: 'article/CreateArticle.vue'
      })
    }
  }
}
</script>
 
<style scoped lang="scss"></style>
 
<template>
  <div class="tag-container">
    <el-tag size="small" v-for="(item, index) in tags" :key="item.path" 
      :effect="$route.path === item.path ? 'dark' : 'plain'" :closable="item.path !== '/home'"
      @close="handleClose(item, index)" @click="changeMenu(item)">
      {{ item.name }}
    </el-tag>
  </div>
</template>
<script>
import { mapMutations, mapState } from 'vuex';
export default {
  data() {
    return {}
  },
  computed: {
    ...mapState({
      tags: state => state.tab.navList
    })
  },
  methods: {
    ...mapMutations(['closeTag']),
    // 点击tag跳转的功能
    changeMenu(item) {
      if (item.path !== this.$route.path) {
        this.$router.push({ path: item.path })
      }
    },
    handleClose(item, index) {
      this.closeTag(item)
      if (this.$route.path !== item.path) return
      if (this.tags.length === index) {
        this.$router.push({
          path: this.tags[index - 1].path
        })
      } else {
        this.$router.push({
          path: this.tags[index].path
        })
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.tag-container {
  margin-top: -10px;
  margin-bottom: 10px;

  .el-tag {
    margin-right: 14px;
    cursor: pointer;
  }
}
</style>
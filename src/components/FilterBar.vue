<template>
  <div class="filter-bar">
    <slot />
    <div class="filter-actions">
      <el-button type="primary" @click="$emit('query')">查询</el-button>
      <el-button @click="$emit('reset')">重置</el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FilterBar',
}
</script>

<style scoped lang="scss">
.filter-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 30px;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
  box-shadow: 0 2px 4px #efebeb;
  border-radius: 8px;
  position: sticky;
  top: -16px;
  z-index: 99;
  background: #fff;
}
.filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
  grid-column: -1; // 表示元素从最后一条线开始，占据1列，即放在最后一个格子
  align-self: end;
}
.filter-actions .el-button + .el-button {
  margin-left: 0;
}
</style>

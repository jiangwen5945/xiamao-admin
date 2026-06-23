<template>
  <div class="filter-item">
    <span class="filter-label">{{ label }}</span>
    <slot />
  </div>
</template>

<script>
export default {
  name: 'FilterBarItem',
  props: {
    label: { type: String, default: '' },
  },
}
</script>

<style scoped lang="scss">
.filter-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.filter-label {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
  text-align: right;
  width: 60px;
  flex-shrink: 0;
}
:deep(.el-input),
:deep(.el-select) {
  flex: 1;
  min-width: 0;
}
</style>

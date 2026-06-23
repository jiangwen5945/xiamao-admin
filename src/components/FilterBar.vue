<template>
  <!--
    通用筛选栏。默认 slot 放筛选条件，#actions slot 自定义按钮区域。
    可选 prop: :columns query-text reset-text :debounce
  -->
  <div class="filter-bar" :style="{ gridTemplateColumns: `repeat(${columns}, 1fr)` }">
    <!-- 筛选条件，由调用方通过默认 slot 传入 -->
    <slot />
    <!-- 操作按钮区域，默认含查询+重置，可通过 #actions slot 替换 -->
    <div class="filter-actions" :style="{ gridColumn: columns }">
      <slot name="actions">
        <el-button type="primary" @click="handleQuery">{{ queryText }}</el-button>
        <el-button @click="handleReset">{{ resetText }}</el-button>
      </slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FilterBar',
  props: {
    /** 网格列数，决定每行显示几个筛选条件 */
    columns: { type: Number, default: 4, validator: v => v > 0 },
    /** 查询按钮文字 */
    queryText: { type: String, default: '查询' },
    /** 重置按钮文字 */
    resetText: { type: String, default: '重置' },
    /** 查询防抖毫秒数，0 表示不防抖 */
    debounce: { type: Number, default: 0, validator: v => v >= 0 },
  },
  data() {
    return {
      debounceTimer: null,
    }
  },
  methods: {
    /** 触发查询事件，支持防抖 */
    handleQuery() {
      if (this.debounce > 0) {
        clearTimeout(this.debounceTimer)
        this.debounceTimer = setTimeout(() => this.$emit('query'), this.debounce)
      } else {
        this.$emit('query')
      }
    },
    /** 触发重置事件，同时取消 pending 的防抖查询 */
    handleReset() {
      clearTimeout(this.debounceTimer)
      this.$emit('reset')
    },
  },
  beforeDestroy() {
    clearTimeout(this.debounceTimer)
  },
}
</script>

<style scoped lang="scss">
.filter-bar {
  display: grid;
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
  align-self: end;
}
.filter-actions .el-button + .el-button {
  margin-left: 0;
}
</style>

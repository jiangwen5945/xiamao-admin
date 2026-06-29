<template>
  <div class="page">
    <div class="config-header">
      <h2 class="config-title">系统配置</h2>
      <el-button type="primary" size="medium" @click="handleSave" :loading="saving">保存配置</el-button>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane
        v-for="group in groupList"
        :key="group.key"
        :label="group.label"
        :name="group.key"
      >
        <el-card shadow="never" class="config-card">
          <div class="config-desc">{{ group.desc }}</div>
          <el-form ref="configForm" :model="configForm" label-width="200px" class="config-form">
            <div
              v-for="item in group.items"
              :key="item.id"
              class="config-item"
            >
              <el-form-item :label="item.description">
                <el-input
                  v-if="item.key === 'site_logo' || item.key.endsWith('_url') || item.key.endsWith('_email')"
                  v-model="configForm[item.key]"
                  :placeholder="'请输入' + item.description"
                />
                <el-input
                  v-else-if="item.key === 'service_phone'"
                  v-model="configForm[item.key]"
                  :placeholder="'请输入' + item.description"
                />
                <el-input
                  v-else-if="item.key === 'service_time'"
                  v-model="configForm[item.key]"
                  :placeholder="'请输入' + item.description"
                />
                <el-input-number
                  v-else-if="item.key.endsWith('_minutes') || item.key.endsWith('_days') || item.key.endsWith('_amount')"
                  v-model="configForm[item.key]"
                  :min="0"
                  :max="99999"
                  class="input-number"
                />
                <el-input
                  v-else
                  v-model="configForm[item.key]"
                  :placeholder="'请输入' + item.description"
                />
              </el-form-item>
            </div>
          </el-form>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <div class="config-footer">
      <el-button type="primary" size="medium" @click="handleSave" :loading="saving">保存配置</el-button>
      <el-button size="medium" @click="getConfigs">重置</el-button>
    </div>
  </div>
</template>

<script>
const GROUPS = {
  basic: {
    label: '基础设置',
    desc: '网站基本信息和联系方式配置',
  },
  order: {
    label: '订单设置',
    desc: '订单流转相关的时间阈值和数量限制',
  },
  shipping: {
    label: '运费设置',
    desc: '运费计算规则配置',
  },
}

export default {
  name: "SystemConfig",
  data() {
    return {
      activeTab: 'basic',
      configList: [],
      configForm: {},
      saving: false,
    }
  },
  computed: {
    groupList() {
      const map = {}
      for (const c of this.configList) {
        const g = c.group || 'basic'
        if (!map[g]) map[g] = { ...GROUPS[g], key: g, items: [] }
        map[g].items.push(c)
      }
      return Object.values(map)
    },
  },
  created() {
    this.getConfigs()
  },
  activated() {
    this.getConfigs()
  },
  methods: {
    async getConfigs() {
      const res = await this.$api.getSystemConfigs()
      this.configList = res.list || []
      const form = {}
      for (const c of this.configList) {
        form[c.key] = parseValue(c.value, c.key)
      }
      this.configForm = form
    },
    async handleSave() {
      this.saving = true
      try {
        const changes = []
        for (const c of this.configList) {
          const val = this.configForm[c.key]
          if (val !== undefined && String(val) !== c.value) {
            changes.push({ id: c.id, value: val })
          }
        }
        if (changes.length === 0) {
          this.$message({ type: 'info', message: '没有需要保存的变更' })
          this.saving = false
          return
        }
        await this.$api.updateSystemConfigs({ configs: changes })
        this.$message({ type: 'success', message: `已保存 ${changes.length} 项配置` })
        this.getConfigs()
      } catch (err) {
        this.$message({ type: 'error', message: err.message || '保存失败' })
      }
      this.saving = false
    },
  },
}

function parseValue(val, key) {
  if (val === null || val === undefined) return ''
  if (key.endsWith('_minutes') || key.endsWith('_days') || key.endsWith('_amount')) {
    const n = Number(val)
    return isNaN(n) ? 0 : n
  }
  return String(val)
}
</script>

<style scoped lang="scss">
.config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.config-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}
.config-card {
  border: none;
  padding: 0 8px;
}
.config-desc {
  font-size: 13px;
  color: #c0c4cc;
  margin-bottom: 24px;
}
.config-form {
  max-width: 680px;
}
.config-item {
  padding-bottom: 4px;
  .el-form-item {
    margin-bottom: 18px;
  }
}
.input-number {
  width: 180px;
}
.config-footer {
  margin-top: 16px;
  padding: 8px 0 0;
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>

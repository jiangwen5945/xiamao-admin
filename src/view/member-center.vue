<template>
  <div class="page">
    <div class="profile-header">
      <img v-if="user.avatar" :src="user.avatar" class="avatar" />
      <div class="profile-meta">
        <h3>{{ user.nickname || '未设置昵称' }}</h3>
        <span class="role-tags">
          <el-tag v-for="role in user.Roles" :key="role.id" size="small">{{ role.name }}</el-tag>
        </span>
      </div>
    </div>
    <div class="info-grid">
      <div class="info-item">
        <span class="label">账号</span>
        <span class="value">{{ user.username }}</span>
      </div>
      <div class="info-item">
        <span class="label">性别</span>
        <span class="value">{{ genderText }}</span>
      </div>
      <div class="info-item">
        <span class="label">生日</span>
        <span class="value">{{ user.birth || '未设置' }}</span>
      </div>
      <div class="info-item">
        <span class="label">邮箱</span>
        <span class="value">{{ user.email || '未设置' }}</span>
      </div>
      <div class="info-item">
        <span class="label">手机号</span>
        <span class="value">{{ user.phone || '未设置' }}</span>
      </div>
      <div class="info-item">
        <span class="label">部门</span>
        <span class="value">{{ user.Department ? user.Department.name : '未分配' }}</span>
      </div>
      <div class="info-item">
        <span class="label">创建时间</span>
        <span class="value">{{ user.createdAt }}</span>
      </div>
      <div class="info-item">
        <span class="label">更新时间</span>
        <span class="value">{{ user.updatedAt }}</span>
      </div>
      <div class="info-item">
        <span class="label">用户状态</span>
        <span class="value">
          <el-tag :type="user.status === 1 ? 'success' : 'danger'" size="small">
            {{ user.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </span>
      </div>
    </div>
  </div>
</template>
 
<script>



function getLocalUserInfo() {
  try {
    return JSON.parse(localStorage.getItem('userInfo') || 'null')
  } catch {
    return null
  }
}

export default {
  name: "memberView",

  async created() {
    const userInfo = this.$store.state.tab.userInfo || getLocalUserInfo()
    if (!userInfo) return
    try {
      const res = await this.$api.getUserDetail({ id: userInfo.id })
      this.user = res
    } catch {
      this.$message?.error?.('获取用户信息失败')
    }
  },
  data() {
    return {
      user: {},
    }
  },
  computed: {
    genderText() {
      const map = { '1': '男', '2': '女' }
      return map[this.user.gender] || '未设置'
    },
  },
}
</script>
 
<style lang="scss" scoped>
.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-meta {
  h3 {
    margin: 0 0 8px;
    font-size: 20px;
  }
}

.role-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.role-tags .el-tag {
  margin: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding-top: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  .label {
    flex-shrink: 0;
    width: 80px;
    color: #909399;
    font-size: 14px;
  }
  .value {
    color: #303133;
    font-size: 14px;
  }
}
</style>
 
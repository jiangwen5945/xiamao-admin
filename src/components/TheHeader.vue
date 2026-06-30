<template>
  <!-- 顶部导航栏 -->
  <div class="header-container">
    <!-- 左侧：折叠按钮 + 面包屑 -->
    <div class="l-container">
      <el-button icon="el-icon-menu" size="mini" @click="handleBtn" style="margin-right: 20px;" />
      <el-breadcrumb separator="/">
        <el-breadcrumb-item
          v-for="item in crumbsList"
          :key="item.path"
          :to="{ path: item.path }"
        >
          <span class="nav-text">{{ item.name }}</span>
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <!-- 右侧：功能图标 + 角色切换 + 用户信息 -->
    <div class="r-container">
      <div class="theme-icon">
        <el-badge :value="unreadCount" :hidden="!unreadCount" class="notice-badge">
          <i class="el-icon-bell" @click="handleNoticeClick" />
        </el-badge>
        <i class="el-icon-lock" @click="setLockScreen(true)" />
        <i :class="[theme === 'dark' ? 'el-icon-sunny' : 'el-icon-moon']" @click="setTheme(theme)" />
      </div>
      <!-- 角色切换下拉 -->
      <el-dropdown @command="handleRoleSwitch" style="margin-right: 12px">
        <span class="el-dropdown-link">
          {{ currentRole.name || '切换角色'}}
          <i class="el-icon-arrow-down el-icon--right" />
        </span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item
            v-for="role in userRoles"
            :key="role.id"
            :command="role.id"
          >
            {{ role.name }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
      <!-- 用户头像与名称下拉 -->
      <el-dropdown @command="handleCommand">
        <div class="el-dropdown-link avatar-box">
          <el-avatar :src="userInfo.avatar" />
          <span class="username">{{ userInfo.username }}</span>
        </div>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="member">个人中心</el-dropdown-item>
          <el-dropdown-item command="logout">退出</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>

    <el-drawer
      :visible.sync="noticeDrawerVisible"
      title="通知消息"
      size="420px"
      :destroy-on-close="true"
    >
      <div class="notice-list">
        <div v-for="item in noticeList" :key="item.id" class="notice-item" :class="{ unread: !item.is_read }" @click="handleReadNotice(item)">
          <div class="notice-content">
            <span class="notice-dot" v-if="!item.is_read" />
            <div class="notice-text-wrapper">
              <span class="notice-title" v-if="item.title">{{ item.title }}</span>
              <span class="notice-text">{{ item.content }}</span>
            </div>
          </div>
          <div class="notice-time">{{ item.created_at }}</div>
        </div>
        <el-empty v-if="!noticeList.length" description="暂无通知" />
      </div>
    </el-drawer>
  </div>
</template>

<script>
import Cookie from 'js-cookie'
import { mapActions, mapState } from 'vuex'

export default {
  data() {
    return {
      noticeDrawerVisible: false,
      noticeList: [],
      unreadCount: 0,
    }
  },
  computed: {
    ...mapState({
      crumbsList: state => state.tab.crumbsList,
      theme: state => state.setting.theme,
    }),
    // 当前用户信息
    userInfo() {
      return this.$store.state.tab.userInfo || JSON.parse(localStorage.getItem('userInfo'))
    },
    // 当前用户可选角色列表
    userRoles() {
      return (this.userInfo && this.userInfo.Roles) || []
    },
    // 当前选中的角色 ID（通过 handleRoleSwitch 触发切换）
    currentRole() {
      return this.$store.state.tab.currentRole || {}
    }
  },
  watch: {
    // 路由变化时更新面包屑
    '$route.path'() {
      this.$store.dispatch('updateCrumbs', this.$route.path)
    }
  },
  mounted() {
    if (!this.$store.state.tab.currentRole && this.userRoles.length) {
      this.$store.dispatch('switchCurrentRole', { role: this.userRoles[0], router: this.$router })
    }
    this.fetchNotifications()
    this.$root.$on('notification-sent', this.fetchNotifications)
  },
  beforeDestroy() {
    this.$root.$off('notification-sent', this.fetchNotifications)
  },
  methods: {
    // 折叠/展开侧边菜单
    handleBtn() {
      this.$store.commit('handleCollapseMenu')
    },
    // 切换当前角色
    handleRoleSwitch(roleId) {
      const role = roleId ? this.userRoles.find(r => r.id === roleId) : null
      this.$store.dispatch('switchCurrentRole', { role, router: this.$router })
        .then(() => {
          if (!this.$route.matched.length || this.$route.path === '*') {
            this.$router.push('/home')
          }
        })
    },
    // 处理用户下拉菜单事件（个人中心 / 退出）
    handleCommand(command) {
      if (command === 'logout') {
        Cookie.remove('token')
        localStorage.removeItem('menuArray')
        localStorage.removeItem('userInfo')
        localStorage.removeItem('currentRole')
        this.$message.success('退出成功!')
        this.$router.push('/login')
      }
      if (command === 'member') {
        if (this.$route.path === '/member') return
        this.$router.push('/member')
      }
    },
    ...mapActions('setting', [
      'setLockScreen',
      'setTheme'
    ]),
    handleNoticeClick() {
      this.noticeDrawerVisible = true
      this.fetchNotifications()
    },
    async fetchNotifications() {
      const userId = this.userInfo?.id
      if (!userId) return
      const res = await this.$api.getSiteMessageList({ receiver_type: 'admin', receiver_id: userId })
      this.noticeList = res.list || []
      this.unreadCount = this.noticeList.filter(n => !n.is_read).length
    },
    async handleReadNotice(item) {
      if (item.is_read) return
      await this.$api.markSiteMessageRead({ id: item.id })
      item.is_read = true
      this.unreadCount = Math.max(0, this.unreadCount - 1)
    },
  }
}
</script>

<style lang="scss" scoped>
.header-container {
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;

  // 左侧区域
  .l-container {
    display: flex;
    align-items: center;

    .el-breadcrumb__item {
      .nav-text {
        color: #666;
        font-size: 14px;
      }

      &:last-child .nav-text {
        color: #545c64;
      }
    }
  }

  // 右侧区域
  .r-container {
    display: flex;
    align-items: center;
    margin-right: 20px;

    .el-dropdown-link {
      cursor: pointer;
      color: #545c64;
      font-size: 13px;
    }

    .avatar-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .username {
      color: #545c64;
      font-size: 12px;
      margin-left: 8px;
    }

    // 功能图标
    .theme-icon {
      font-size: 20px;
      margin-right: 16px;

      i {
        margin-left: 12px;
      }
    }
  }
}

.notice-badge {
  ::v-deep .el-badge__content {
    top: 8px;
    right: 4px;
  }
}

.notice-list {
  padding: 0 16px;
}

.notice-item {
  padding: 12px 8px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #f5f7fa;
  }

  &.unread {
    background: #f0f7ff;
  }
}

.notice-content {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.notice-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #409eff;
  flex-shrink: 0;
  margin-top: 6px;
}

.notice-text-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.notice-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.notice-text {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.notice-time {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
  padding-left: 12px;
}
</style>

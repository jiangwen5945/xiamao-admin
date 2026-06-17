<template>
  <div class="header-container">
    <div class="l-container">
      <el-button icon="el-icon-menu" size="mini" @click="handleBtn" style="margin-right: 20px;"></el-button>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: item.path }" v-for="item in crumbsList" :key="item.path">
          <span class="nav-text">{{ item.name }}</span>
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="r-container">
      <span class="timer"> {{ currentTime }}</span>
      <div class="theme-icon">
        <i class="el-icon-lock" @click="setLockScreen(true)"/>
        <i :class="[isFullScreen ? 'el-icon-crop' : 'el-icon-full-screen']" @click="setFullScreen"/> 
        <i :class="[theme === 'dark' ? 'el-icon-sunny' : 'el-icon-moon']" @click="setTheme(theme)" />
        <i class="el-icon-bell"/>
      </div>
      <el-dropdown @command="handleCommand">
        <div class="el-dropdown-link avatar-box">
          <el-avatar :src="userInfo.avatar"></el-avatar>
          <span class="username">{{ userInfo.userName }}</span>
        </div>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="member">个人中心</el-dropdown-item>
          <el-dropdown-item command="logout">退出</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>
<script>
import Cookie from 'js-cookie'
import { mapActions, mapState } from 'vuex';
import { formatDate } from '@/utils/format'
export default {
  data() {
    return {
      timer: null,
      currentTime: formatDate(),
    }
  },
  mounted(){
    this.getCurrentTime()
  },
  methods: {
    // 获取当前实时时间
    getCurrentTime(){
      this.timer = setInterval(() => {
        this.currentTime = formatDate()
      }, 1000);
    },
    // 处理下拉菜单选项中的事件
    handleCommand(command) {
      if (command === 'logout') {
        Cookie.remove('token')  // 退出清除token
        localStorage.removeItem('menuArray')
        localStorage.removeItem('userInfo')
        this.$message.success('退出成功!');
        this.$router.push('/login')
      }
      if(command === 'member') {
        if(this.$route.path === '/member') return
        this.$router.push('/member')
      }
    },
    // 折叠侧边菜单栏
    handleBtn() {
      this.$store.commit('handleCollapseMenu')
    },
    ...mapActions('setting',[
      'setLockScreen',
      'setFullScreen',
      'setTheme'
    ])
  },
  computed: {
    ...mapState({
      navList: state => state.tab.navList,
      crumbsList: state => state.tab.crumbsList,
      theme: state => state.setting.theme,
      isFullScreen: state => state.setting.isFullScreen,
    }),
    userInfo() {
      return this.$store.state.tab.userInfo || JSON.parse(localStorage.getItem('userInfo'))
    }
  },
  watch:{
    '$route.path'(newVal, oldVal) {
      if(newVal !== oldVal){
        // 根据当前路由地址更新面包屑
        this.$store.commit('updateCrumbs', newVal)
      }
    },
  },
  beforeDestroy() {
    // 在Vue实例销毁前，清除我们的定时器
    if (this.timer) {
      clearInterval(this.timer); 
    }
  }
}
</script>

<style lang="scss" scoped>
.header-container {
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .l-container {
    display: flex;
    align-items: center;

    .el-breadcrumb__item {
      .nav-text {
        color: #666;
        font-size: 14px;
      }

      &:last-child {
        .nav-text {
          color: #545c64;
        }
      }
    }
  }

  .r-container {
    display: flex;
    align-items: center;
    margin-right: 20px;
    .timer {
      font-size: 14px;
      color: #666;
      width: 150px;
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

    .theme-icon {
      font-size: 20px;
      margin-right: 16px;

      i {
        margin-left: 12px;
      }
    }
  }
}
</style>
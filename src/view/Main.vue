<template>
  <div class="container">
      <el-aside width="auto">
        <TheMenu />
      </el-aside>
      <el-container>
        <el-header>
          <TheHeader />
        </el-header>
        <el-main>
          <TheNav />
          <!-- 这里是会被缓存的视图组件(对name为member的组件不缓存) -->
          <keep-alive exclude="member"> 
            <router-view v-if="$route.meta.keepAlive"></router-view>
          </keep-alive>
          <!-- 这里是不被缓存的视图组件 -->
          <router-view v-if="!$route.meta.keepAlive"></router-view>
        </el-main>
      </el-container>
    <!-- 屏幕内容保护组件 -->
    <LockScreen />
  </div>
</template>

<script>
import TheMenu from '../components/TheMenu'
import TheHeader from '../components/TheHeader'
import TheNav from '../components/TheNav'
import LockScreen from '@/components/LockScreen.vue'
export default {
  name: 'MainView',
  props: {
    msg: String
  },
  components: {
    TheMenu,
    TheHeader,
    TheNav,
    LockScreen
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: row;
  height: 100vh;
}
.el-header {
  box-shadow: 0 1px 4px rgba(0, 21, 41, .08);
  border-bottom: 1px solid rgba(0, 21, 41, .08);
}

.el-main {
  background: #f7f7f7;
  height: calc(100vh - 60px)
}

.el-aside {
  background: var(--color-background);
  .el-menu{
    border-right: 1px solid var(--color-background);
  }
}
</style>

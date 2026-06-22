<template>
  <el-menu 
      router
      :default-active='$route.path'
      class="aside-menu"
      :collapse="isCollapse"
  > 
      <!-- 菜单标题 -->
      <el-menu-item class='menu-header'>
        <el-image  :src="require('@/assets/logo.png')"  style="width: 30px; height: 30px; margin-right: 6px"></el-image>
        <span v-show="!isCollapse">瞎猫管理系统</span>
      </el-menu-item>
      <!-- 没有二级菜单 -->
      <el-menu-item :index="item.path" v-for="item in noChildren" :key="item.path" @click="handleUrl(item)">
          <i :class="`el-icon-${item.icon}`"></i>
          <span slot="title">{{item.name}}</span>
      </el-menu-item>
      <!-- 有二级菜单 -->
      <el-submenu :index="item.path" v-for="item in hasChildren" :key="item.path">
          <template slot="title">
            <i :class="`el-icon-${item.icon}`"></i>
            <span slot="title">{{item.name}}</span>
          </template>
          <el-menu-item-group>
            <el-menu-item :index="subItem.path"  @click="handleUrl(subItem)" v-for="subItem in item.children" :key="subItem.path">
                <template slot="title">
                    <i :class="`el-icon-${subItem.icon}`"></i>
                    <span slot="title"> {{subItem.name}}</span>
                </template>
            </el-menu-item>
          </el-menu-item-group>
      </el-submenu>
  </el-menu>
</template>
<script>
export default {
  methods: {
    handleUrl(item) {
      // if (this.$route.path !== item.path && !(this.$route.path === '/home' && item.path === '/')) {
      //   this.$router.push({ path: item.path, query: { name: item.name }})
      // }
      // 调用导航栏更新
      this.$store.commit('updateNavList', item)
    }
  },
  computed: {
    hasChildren() {
      return this.menuArray.filter(item => item.children && item.children.length)
    },
    noChildren() {
      return this.menuArray.filter(item => (!item.children || !item.children.length) && item.icon)
    },
    isCollapse() {
      return this.$store.state.tab.isCollapse
    },
    menuArray() {
      // 缓存中存在则在缓存中读取，否则重新获取
      return JSON.parse(localStorage.getItem('menuArray')) || this.$store.state.tab.menuArray
    }
  }
}
</script>
<style lang="scss" scoped>
// 处理折叠侧边栏时抖动
.aside-menu:not(.el-menu--collapse) {
  width: 200px;
  min-height: 400px;
}

.aside-menu {
  height: 100vh;
  min-height: 100vh;
  border-right: none;
  background: var(--color-background) !important;

  // 有二级菜单
  .el-submenu__title {
    span {
      color: var(--color-font);
    }
    i {
      color: var(--color-font);
    }
    &:hover{
      span {
        color: var(--color-active);
      }
      i {
        color: var(--color-active);
      }
    }
  }
  .el-menu-item-group {
    background: var(--color-background) !important;
    overflow: hidden; // 避免二级菜单展开过程中白底色闪烁
    .el-menu-item{
      color: var(--color-font);
      i {
        color: var(--color-font);
      }
      &.is-active{
        color:  var(--color-active);
        i {
          color:  var(--color-active);
        }
      }
      
      &:hover{
        color: var(--color-active);
        i {
          color:  var(--color-active);
        }
      }
    }
  }

  // 没有二级菜单
  .el-menu-item {
    color: var(--color-font);
    i {
      color: var(--color-font);
    }
    &.is-active {
      color:  var(--color-active);
    }
    &:hover{
      color:  var(--color-active);
      i {
        color:  var(--color-active);
      }
    }
  }
}
</style>
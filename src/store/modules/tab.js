import {resetRouter} from '@/router'
import { userPermission, saveUserInfo } from '@/api'
export default {
  state: {
    isCollapse: false, // 控制菜单展开或关闭
     // 导航栏数组
    navList: [{
      path: '/home',
      name: '首页',
      icon: 's-home'
    }],
    // 面包屑数组
    crumbsList: [{
      path: '/home',
      name: '首页'
    }],
    menuArray: [],
    userInfo: ''
  },
  mutations: {
    // 更新面包屑数据
    updateCrumbs(state, path){
      const menuArray = JSON.parse(localStorage.getItem('menuArray')) || []
      const getLabel = function(arr,p){
        for (let i = 0; i < arr.length; i++) {
          if(arr[i].path === p){
            return arr[i].name
          }
          if(arr[i].children){
            for (let j = 0; j < arr[i].children.length; j++) {
              if( arr[i].children[j].path === p){
                return arr[i].children[j].name
              }
            }
          }
        }
      }
      const crumb = {
        path,
        name: getLabel(menuArray, path)
      } 
      if (path !== '/home') {
        state.crumbsList.splice(1,1,crumb)
      }
    },
    // 折叠侧边菜单栏
    handleCollapseMenu(state) {
      state.isCollapse = !state.isCollapse
    },
    // 更新导航栏数组数据
    updateNavList(state, item) {
      if (item.path !== '/home' && state.navList.findIndex(e => e.path === item.path) === -1) {
        state.navList.push(item)
      }
    },
    closeTag(state, item) {
      const tagIndex = state.navList.findIndex(e => e.path === item.path)
      state.navList.splice(tagIndex, 1)
    },
    setUserInfo(state, val) {
      state.userInfo = val
      localStorage.setItem('userInfo', JSON.stringify(val))
    },
    // 设置菜单数据
    setMenuArray(state, val) {
      state.menuArray = val
      localStorage.setItem('menuArray', JSON.stringify(val))
    },
    // 动态注册路由
    addMenuToRouter(state, router) {
      if (!localStorage.getItem('menuArray')) return
      const menuArray = JSON.parse(localStorage.getItem('menuArray'))
      state.menuArray = menuArray
      const fomatMenuArr = []
      menuArray.forEach(el => {
        if (el.children) {
          el.children = el.children.map(item => ({
            ...item,
            component: () => import(`@/view/${item.component}`)
          }))
          fomatMenuArr.push(...el.children)
        } else {
          el.component = () => import(`@/view/${el.component}`)
          fomatMenuArr.push(el)
        }
      });
      fomatMenuArr.push({
        path: '*',
        name: 'ErrorView',
        component: ()=>import('@/view/Error.vue')
      })
      resetRouter()
      fomatMenuArr.forEach(item => {
        router.addRoute('main', item)
      })
    }
  },
  actions:{
    async changeUserInfo(ctx, data){
       // 验证用户密码
       await userPermission(data)
       const res = await saveUserInfo(data)
       ctx.commit('setUserInfo', res.userInfo)
    }
  }

}
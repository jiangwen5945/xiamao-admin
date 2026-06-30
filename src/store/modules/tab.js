import {resetRouter} from '@/router'
import { getUserMenus } from '@/api'

function loadFromStorage(key, fallback = null) {
  try {
    const val = localStorage.getItem(key)
    return val ? JSON.parse(val) : fallback
  } catch {
    return fallback
  }
}

export default {
  state: {
    isCollapse: false,
    navList: [{
      path: '/home',
      name: '首页',
      icon: 's-home'
    }],
    crumbsList: [{
      path: '/home',
      name: '首页'
    }],
    menuArray: loadFromStorage('menuArray', []),
    userInfo: loadFromStorage('userInfo', ''),
    currentRole: loadFromStorage('currentRole', null),
  },
  mutations: {
    setCrumbs(state, { path, name }) {
      if (path !== '/home') {
        state.crumbsList.splice(1, 1, { path, name })
      }
    },
    handleCollapseMenu(state) {
      state.isCollapse = !state.isCollapse
    },
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
    },
    setCurrentRole(state, role) {
      state.currentRole = role
    },
    setMenuArray(state, val) {
      state.menuArray = val
    },
  },
  actions: {
    updateUserInfo({ commit }, val) {
      commit('setUserInfo', val)
      localStorage.setItem('userInfo', JSON.stringify(val))
    },
    updateCurrentRole({ commit }, role) {
      commit('setCurrentRole', role)
      localStorage.setItem('currentRole', JSON.stringify(role))
    },
    updateMenuArray({ commit }, val) {
      commit('setMenuArray', val)
      localStorage.setItem('menuArray', JSON.stringify(val))
    },
    async switchCurrentRole({ dispatch }, { role, router }) {
      await dispatch('updateCurrentRole', role)
      const menus = await getUserMenus(role && role.id)
      await dispatch('updateMenuArray', menus)
      dispatch('addMenuToRouter', router)
    },
    addMenuToRouter({ state }, router) {
      if (!state.menuArray || !state.menuArray.length) return
      const menuArray = state.menuArray
      const fomatMenuArr = []
      menuArray.forEach(el => {
        if (el.children && el.children.length) {
          el.children = el.children.map(item => ({
            ...item,
            component: item.component ? () => import(`@/view/${item.component}`) : undefined
          }))
          fomatMenuArr.push(...el.children)
        } else if (el.component) {
          const componentPath = el.component
          el.component = () => import(`@/view/${componentPath}`)
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
    },
    updateCrumbs({ state, commit }, path) {
      const menuArray = state.menuArray
      const getLabel = function(arr, p) {
        for (let i = 0; i < arr.length; i++) {
          if (arr[i].path === p) return arr[i].name
          if (arr[i].children) {
            for (let j = 0; j < arr[i].children.length; j++) {
              if (arr[i].children[j].path === p) return arr[i].children[j].name
            }
          }
        }
      }
      commit('setCrumbs', { path, name: getLabel(menuArray, path) })
    },
  }
}

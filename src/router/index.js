import Vue from 'vue'
import VueRouter from 'vue-router'
import Cookie from 'js-cookie'
Vue.use(VueRouter)

// 1. 定义组件
import Main from '../view/Main.vue'
// import HomeView from '../view/HomeView.vue'
// import Mall from '../view/Mall.vue'
// import UserManage from '../view/UserManage.vue'
// import PageOne from '../view/PageOne.vue'
// import PageTwo from '../view/PageTwo.vue'
import Login from '../view/Login.vue'
// import Error from '../view/Error.vue'
// 2. 定义路由
const routes = [
  {
    path: '/',
    component: Main,
    name: 'main',
    redirect: '/home',
    children: []
  },
  {
    path: '/login',
    component: Login,
    name: 'LoginView'
  }
]
// 3. 创建实例
const router = new VueRouter({
  routes // (缩写) 相当于 routes: routes
})

// 前置导航守卫
router.beforeEach((to, from, next) => {
  const token = Cookie.get('token')
  if (!token && to.name !== 'LoginView') {
    next({ name: 'LoginView' })
  } else if (token && to.name === 'LoginView') {
    next({ name: 'home' })
  } else {
    next()
  }
})

// 解决vue路由警告:Duplicate named routes definition问题
export function resetRouter () {
	const newRouter = new VueRouter({
    routes
  })
	router.matcher = newRouter.matcher
}

export default router
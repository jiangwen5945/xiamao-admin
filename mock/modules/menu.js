import Mock from 'mockjs'

function param2Obj(url) {
  const search = url.split('?')[1]
  if (!search) {
    return {}
  }
  return JSON.parse(
    '{"' +
    decodeURIComponent(search)
      .replace(/"/g, '\\"')
      .replace(/&/g, '","')
      .replace(/=/g, '":"') +
    '"}'
  )
}

// 扁平菜单列表，通过 parent_id 体现层级关系
const mockList = [
  { id: 1000, parent_id: null, parent_name: '', type: 1, name: '用户管理', icon: 'user', path: '/user', component: 'views/UserManage.vue', sort: 1, status: 1, roles: ['管理员'] },
  { id: 1001, parent_id: null, parent_name: '', type: 1, name: '菜单管理', icon: 'turn-off', path: '/menu', component: 'views/MenuManage.vue', sort: 2, status: 1, roles: ['管理员'] },
  { id: 1002, parent_id: null, parent_name: '', type: 1, name: '角色管理', icon: 's-check', path: '/role', component: 'views/RoleManage.vue', sort: 3, status: 1, roles: ['管理员'] },
  { id: 1003, parent_id: null, parent_name: '', type: 1, name: '部门管理', icon: 's-marketing', path: '/class', component: 'views/ClassManage.vue', sort: 4, status: 1, roles: ['管理员'] },
  { id: 1004, parent_id: null, parent_name: '', type: 1, name: '商品管理', icon: 'box', path: '/goods', component: '', sort: 5, status: 1, roles: ['管理员', '客服', '运营'] },
  { id: 1005, parent_id: 1004, parent_name: '商品管理', type: 2, name: '商品列表', icon: 's-order', path: '/goods/list', component: 'views/GoodsList.vue', sort: 1, status: 1, roles: ['管理员', '客服', '仓管'] },
  { id: 1006, parent_id: 1004, parent_name: '商品管理', type: 2, name: '商品分类', icon: 's-grid', path: '/goods/category', component: 'views/GoodsCategory.vue', sort: 2, status: 1, roles: ['管理员', '客服'] },
  { id: 1007, parent_id: null, parent_name: '', type: 1, name: '订单管理', icon: 's-claim', path: '/order', component: 'views/OrderManage.vue', sort: 6, status: 1, roles: ['管理员'] },
  { id: 1008, parent_id: null, parent_name: '', type: 1, name: '文章管理', icon: 'document', path: '/article', component: '', sort: 7, status: 1, roles: ['管理员'] },
  { id: 1009, parent_id: 1008, parent_name: '文章管理', type: 2, name: '文章列表', icon: 'document-copy', path: '/article/list', component: 'views/ArticleList.vue', sort: 1, status: 1, roles: ['管理员'] },
  { id: 1010, parent_id: 1008, parent_name: '文章管理', type: 2, name: '创建文章', icon: 'edit-outline', path: '/article/create', component: 'views/CreateArticle.vue', sort: 2, status: 1, roles: ['管理员'] },
  { id: 1011, parent_id: null, parent_name: '', type: 1, name: '文件管理', icon: 'files', path: '/file', component: 'views/FileManage.vue', sort: 8, status: 1, roles: ['管理员'] },
]

export default {
  getMenuList: (params) => {
    const { name } = param2Obj(params.url)
    const filtered = name
      ? mockList.filter(e => e.name.indexOf(name) !== -1)
      : mockList
    return {
      code: 200,
      message: 'success',
      result: {
        list: filtered,
        count: filtered.length,
      },
    }
  },

  createMenu: (params) => {
    const { parent_id, type, name, icon, path, component, sort, status, roles } = JSON.parse(params.body)
    const parent = parent_id ? mockList.find(e => e.id === parent_id) : null
    mockList.push({
      id: mockList[mockList.length - 1].id + 1,
      parent_id: parent_id || null,
      parent_name: parent ? parent.name : '',
      type,
      name,
      icon,
      path,
      component,
      sort,
      status,
      roles,
    })
    return {
      code: 200,
      message: 'success',
      result: null,
    }
  },

  deleteMenu: (params) => {
    const { id } = JSON.parse(params.body)
    if (!id) {
      return { code: -999, message: '参数不正确' }
    }
    const idx = mockList.findIndex(e => e.id === id)
    if (idx !== -1) mockList.splice(idx, 1)
    return {
      code: 200,
      message: '删除成功',
      result: { message: '删除成功' },
    }
  },

  updateMenu: (params) => {
    const { id, parent_id, type, name, icon, path, component, sort, status, roles } = JSON.parse(params.body)
    const item = mockList.find(e => e.id === id)
    if (item) {
      const parent = parent_id ? mockList.find(e => e.id === parent_id) : null
      Object.assign(item, {
        parent_id: parent_id || null,
        parent_name: parent ? parent.name : '',
        type,
        name,
        icon,
        path,
        component,
        sort,
        status,
        roles,
      })
    }
    return {
      code: 200,
      result: { message: '编辑成功' },
    }
  },
}

const permissionList = [{
  path: '/home',
  name: 'home',
  label: '首页'
},
{
  path: '/user',
  name: 'user',
  label: '用户管理'
},
{
  path: '/menu',
  name: 'menu',
  label: '菜单管理'
},
{
  path: '/role',
  name: 'role',
  label: '角色管理'
},
{
  path: '/class',
  name: 'class',
  label: '部门管理'
}, {
  path: '/GoodsList',
  name: 'GoodsList',
  label: '商品列表'
},
{
  path: '/GoodsCategory',
  name: 'GoodsCategory',
  label: '商品分类'
}, {
  path: '/order',
  name: 'order',
  label: '订单管理'
}, {
  path: '/ArticleList',
  name: 'articleList',
  label: '文章列表'
},
{
  path: '/CreateArticle',
  name: 'CreateArticle',
  label: '创建文章'
},
{
  path: '/MemberList',
  name: 'MemberList',
  label: '会员列表'
}]

const getPermissionLabel = name => permissionList.find(e => e.name === name).label
export { getPermissionLabel }
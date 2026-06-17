import Mock from 'mockjs'
import homeApi from './modules/home'
import userApi from './modules/user'
import goodsApi from './modules/goods'
import roleApi from './modules/role'
import menuApi from './modules/menu'
import classApi from './modules/class'
import permissionApi from './modules/permission'
import authorityApi from './modules/authority'
import orderApi from './modules/order'
import articleApi from './modules/article'
import filesApi from './modules/files'

// 模拟延时
Mock.setup({
    timeout: '300-600'
})


// 首页数据
Mock.mock('/api/home/getData', homeApi.getStatisticalData)

// 获取登陆用户菜单
Mock.mock(/api\/permissionApi\/getMenu/,'post', permissionApi.getMenu)

// 修改用户信息
Mock.mock(/api\/permissionApi\/saveUserInfo/,'post', permissionApi.saveUserInfo)

// 权限管理
Mock.mock(/api\/authority\/getAuthorityList/, authorityApi.getAuthorityList)

// 用户管理页数据
Mock.mock('/api/user/add', 'post', userApi.createUser)
Mock.mock('/api/user/edit', 'post', userApi.updateUser)
Mock.mock('/api/user/del', 'post', userApi.deleteUser)
// Mock.mock(/api\/user\/getUser/, userApi.getUserList) // 查询接口和获取数据接口为同一个，使用正则模糊匹配接口

/**
 * 商品管理
 */

// 商品列表
Mock.mock(/api\/goods\/getGoodsList/, goodsApi.getGoodsList)
Mock.mock('/api/goods/del', 'post', goodsApi.deleteGoods)
Mock.mock('/api/goods/add', 'post', goodsApi.createGoods)
Mock.mock('/api/goods/edit', 'post', goodsApi.updateGoods)

// 商品分类
Mock.mock(/api\/goods\/getGoodsCategory/, goodsApi.getGoodsCategory)
Mock.mock('/api/goods/category/del', 'post', goodsApi.deleteGoodsCategory)
Mock.mock('/api/goods/category/add', 'post', goodsApi.createGoodsCategory)
Mock.mock('/api/goods/category/edit', 'post', goodsApi.updateGoodsCategory)


// 角色管理
Mock.mock(/api\/role\/getRolesList/, roleApi.getRolesList)
Mock.mock('/api/role/del', 'post', roleApi.deleteRole)
Mock.mock('/api/role/add', 'post', roleApi.createRole)
Mock.mock('/api/role/edit', 'post', roleApi.updateRole)

// 菜单管理
Mock.mock(/api\/menu\/getMenuList/, menuApi.getMenuList)
Mock.mock('/api/menu/del', 'post', menuApi.deleteMenu)
Mock.mock('/api/menu/add', 'post', menuApi.createMenu)
Mock.mock('/api/menu/edit', 'post', menuApi.updateMenu)

// 部门管理
Mock.mock(/api\/class\/getClassList/, classApi.getClassList)
Mock.mock('/api/class/del', 'post', classApi.deleteClass)
Mock.mock('/api/class/add', 'post', classApi.createClass)
Mock.mock('/api/class/edit', 'post', classApi.updateClass)

// 订单管理
Mock.mock(/api\/order\/getOrderList/, orderApi.getOrderList)
Mock.mock('/api/order/del', 'post', orderApi.deleteOrder)
Mock.mock('/api/order/add', 'post', orderApi.createOrder)
Mock.mock('/api/order/edit', 'post', orderApi.updateOrder)


// 文章管理
Mock.mock(/api\/article\/getArticleList/, articleApi.getArticleList)
Mock.mock('/api/article/del', 'post', articleApi.deleteArticle)
Mock.mock('/api/article/add', 'post', articleApi.createArticle)
Mock.mock('/api/article/edit', 'post', articleApi.updateArticle)


// 文件
Mock.mock('/api/checkChunkStatus','post', filesApi.checkChunkStatus)
Mock.mock('/api/uploadFiles','post', filesApi.uploadFiles)
Mock.mock('/api/importExcel','post', filesApi.importExcel)



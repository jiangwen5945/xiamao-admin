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
import memberApi from './modules/member'

Mock.setup({
    timeout: '300-600'
})

Mock.mock('/api/home/getData', homeApi.getStatisticalData)

Mock.mock(/api\/permissionApi\/getMenu/,'post', permissionApi.getMenu)

Mock.mock(/api\/permissionApi\/saveUserInfo/,'post', permissionApi.saveUserInfo)

Mock.mock(/api\/authority\/getAuthorityList/, authorityApi.getAuthorityList)

Mock.mock('/api/user/add', 'post', userApi.createUser)
Mock.mock('/api/user/edit', 'post', userApi.updateUser)
Mock.mock('/api/user/del', 'post', userApi.deleteUser)

/**
 * 商品管理
 */

// 商品列表
Mock.mock(/api\/product\/list/, goodsApi.getGoodsList)
Mock.mock('/api/product/delete', 'post', goodsApi.deleteGoods)
Mock.mock('/api/product/add', 'post', goodsApi.createGoods)
Mock.mock('/api/product/update', 'post', goodsApi.updateGoods)
Mock.mock('/api/product/batchDelete', 'post', goodsApi.batchDeleteGoods)
Mock.mock('/api/product/batchUpdateStatus', 'post', goodsApi.batchUpdateGoodsStatus)

// 商品分类
Mock.mock(/api\/category\/list/, goodsApi.getGoodsCategory)
Mock.mock('/api/category/delete', 'post', goodsApi.deleteGoodsCategory)
Mock.mock('/api/category/add', 'post', goodsApi.createGoodsCategory)
Mock.mock('/api/category/update', 'post', goodsApi.updateGoodsCategory)


// 角色管理
Mock.mock(/api\/role\/getRolesList/, roleApi.getRolesList)
Mock.mock('/api/role/del', 'post', roleApi.deleteRole)
Mock.mock('/api/role/add', 'post', roleApi.createRole)
Mock.mock('/api/role/edit', 'post', roleApi.updateRole)

// 菜单管理
Mock.mock('/api/menu/list', menuApi.getMenuList)
Mock.mock('/api/menu/delete', 'post', menuApi.deleteMenu)
Mock.mock('/api/menu/add', 'post', menuApi.createMenu)
Mock.mock('/api/menu/update', 'post', menuApi.updateMenu)

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


// 会员管理
Mock.mock(/api\/member\/list/, memberApi.getMemberList)
Mock.mock('/api/member/add', 'post', memberApi.createMember)
Mock.mock('/api/member/update', 'post', memberApi.updateMember)
Mock.mock('/api/member/delete', 'post', memberApi.deleteMember)
Mock.mock('/api/member/batchDelete', 'post', memberApi.batchDeleteMember)

// 文件
Mock.mock('/api/checkChunkStatus','post', filesApi.checkChunkStatus)
Mock.mock('/api/uploadFiles','post', filesApi.uploadFiles)
Mock.mock('/api/importExcel','post', filesApi.importExcel)

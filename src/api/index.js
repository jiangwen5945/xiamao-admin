import http from "../utils/request";

// 用户登录
export const login = (data) => {
  return http.post("/auth/login", data);
};
export const getUserMenus = () => {
  return http.get("/user/menus");
};
export const getUserDetail = (params) => {
  return http.get("/user/detail", { params });
};

// 请求首页数据
export const getData = () => {
  return http.get("/home/getData");
};

// 用户
export const getUser = (params) => {
  return http.get("/user/list", { params });
};
export const addUser = (data) => {
  return http.post("/user/add", data);
};
export const editUser = (data) => {
  return http.post("/user/update", data);
};
export const delUser = (data) => {
  return http.post("/user/delete", data);
};

// 用户登录权限
export const userPermission = (data) => {
  return http.post("/permissionApi/getMenu", data);
};
export const saveUserInfo = (data) => {
  return http.post("/permissionApi/saveUserInfo", data);
};

// 权限
export const getAuthorityList = () => {
  return http.get("/authority/getAuthorityList");
};

// 商品
export const getGoodsList = (params) => {
  return http.get("/goods/getGoodsList", { params });
};
export const createGoods = (data) => {
  return http.post("/goods/add", data);
};
export const updateGoods = (data) => {
  return http.post("/goods/edit", data);
};
export const deleteGoods = (data) => {
  return http.post("/goods/del", data);
};

// 商品分类
export const getGoodsCategory = (params) => {
  return http.get("/goods/getGoodsCategory", { params });
};
export const createGoodsCategory = (data) => {
  return http.post("/goods/category/add", data);
};
export const updateGoodsCategory = (data) => {
  return http.post("/goods/category/edit", data);
};
export const deleteGoodsCategory = (data) => {
  return http.post("/goods/category/del", data);
};

// 角色
export const getRolesList = (data) => {
  return http.get("/role/list", data);
};
export const createRole = (data) => {
  return http.post("/role/add", data);
};
export const deleteRole = (data) => {
  return http.post("/role/del", data);
};
export const updateRole = (data) => {
  return http.post("/role/edit", data);
};

// 菜单
export const getMenuList = (data) => {
  return http.get("/menu/list", data);
};
export const createMenu = (data) => {
  return http.post("/menu/add", data);
};
export const deleteMenu = (data) => {
  return http.post("/menu/del", data);
};
export const updateMenu = (data) => {
  return http.post("/menu/edit", data);
};

// 部门
export const getClassList = (data) => {
  return http.get("/class/getClassList", data);
};

export const deleteClass = (data) => {
  return http.post("/class/del", data);
};

export const createClass = (data) => {
  return http.post("/class/add", data);
};

export const updateClass = (data) => {
  return http.post("/class/edit", data);
};

// 订单
export const getOrderList = (params) => {
  return http.get("/order/getOrderList", { params });
};

export const deleteOrder = (data) => {
  return http.post("/order/del", data);
};

export const createOrder = (data) => {
  return http.post("/order/add", data);
};

export const updateOrder = (data) => {
  return http.post("/order/edit", data);
};

// 文章
export const getArticleList = (params) => {
  return http.get("/article/getArticleList", { params });
};

export const deleteArticle = (data) => {
  return http.post("/article/del", data);
};

export const createArticle = (data) => {
  return http.post("/article/add", data);
};

export const updateArticle = (data) => {
  return http.post("/article/edit", data);
};

// 文件
export const checkChunkStatus = (data) => {
  return http.post("/checkChunkStatus", data);
};

export const uploadFiles = (data) => {
  return http.post("/uploadFiles", data);
};

export const importExcel = (data) => {
  return http.post("/importExcel", data);
};

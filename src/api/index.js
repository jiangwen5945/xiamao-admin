import http from "../utils/request";

// 登录
export const login = (data) => {
  return http.post("/auth/login", data);
};
export const getUserMenus = (roleId) => {
  const params = roleId ? { roleId } : {}
  return http.get("/user/menus", { params });
};
export const getUserDetail = (params) => {
  return http.get("/user/detail", { params });
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
export const detail = (data) => {
  return http.get("/user/detail", data);
};

// 角色
export const getRoleList = (params) => {
  return http.get("/role/list", { params });
};
export const createRole = (data) => {
  return http.post("/role/add", data);
};
export const deleteRole = (data) => {
  return http.post("/role/delete", data);
};
export const updateRole = (data) => {
  return http.post("/role/update", data);
};

// 菜单
export const getMenuList = (params) => {
  return http.get("/menu/list", { params });
};
export const createMenu = (data) => {
  return http.post("/menu/add", data);
};
export const deleteMenu = (data) => {
  return http.post("/menu/delete", data);
};
export const updateMenu = (data) => {
  return http.post("/menu/update", data);
};

// 部门
export const getClassList = (params) => {
  return http.get("/dept/list", { params });
};

export const deleteClass = (data) => {
  return http.post("/dept/delete", data);
};

export const createClass = (data) => {
  return http.post("/dept/add", data);
};

export const updateClass = (data) => {
  return http.post("/dept/update", data);
};

// 会员
export const getMemberList = (params) => {
  return http.get("/member/list", { params });
};
export const createMember = (data) => {
  return http.post("/member/add", data);
};
export const updateMember = (data) => {
  return http.post("/member/update", data);
};
export const deleteMember = (data) => {
  return http.post("/member/delete", data);
};

// **************************************************************************** //

// 请求首页数据
export const getData = () => {
  return http.get("/home/getData");
};

// 用户登录权限
export const userPermission = (data) => {
  return http.post("/permissionApi/getMenu", data);
};
export const saveUserInfo = (data) => {
  return http.post("/permissionApi/saveUserInfo", data);
};

// 商品
export const getProductList = (params) => {
  return http.get("/product/list", { params });
};
export const createProduct = (data) => {
  return http.post("/product/add", data);
};
export const updateProduct = (data) => {
  return http.post("/product/update", data);
};
export const deleteProduct = (data) => {
  return http.post("/product/delete", data);
};

// 商品分类
export const getGoodsCategory = (params) => {
  return http.get("/category/list", { params });
};
export const createGoodsCategory = (data) => {
  return http.post("/category/add", data);
};
export const updateGoodsCategory = (data) => {
  return http.post("/category/update", data);
};
export const deleteGoodsCategory = (data) => {
  return http.post("/category/delete", data);
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

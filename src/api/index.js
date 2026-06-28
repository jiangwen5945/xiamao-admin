import http from "../utils/request";
import Cookie from 'js-cookie';

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

// 订单
export const getOrderList = (params) => {
  return http.get("/order/list", { params });
};

export const getAdminOrderList = (params) => {
  return http.get("/order/admin/list", { params });
};

export const createOrder = (data) => {
  return http.post("/order/add", data);
};

export const cancelOrder = (data) => {
  return http.post("/order/cancel", data);
};

export const confirmOrder = (data) => {
  return http.post("/order/confirm", data);
};

// 商品
export const getProductList = (params) => {
  return http.get("/product/list", { params });
};
export const getProductDetail = (id) => {
  return http.get("/product/detail", { params: { id } });
};
export const createProduct = (data) => {
  return http.post("/product/add", data);
};
export const updateProduct = (data) => {
  return http.post("/product/update", data);
};
export const getProductsNotInFlashSale = (params) => {
  return http.get("/product/not-in-flash-sale", { params });
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

// 库存
export const getStockList = (params) => {
  return http.get("/stock/list", { params });
};
export const getStockDetail = (params) => {
  return http.get("/stock/detail", { params });
};
export const adjustStock = (data) => {
  return http.post("/stock/adjust", data);
};
export const inboundStock = (data) => {
  return http.post("/stock/inbound", data);
};
export const getStockMovements = (params) => {
  return http.get("/stock/movements", { params });
};
export const getStockStats = () => {
  return http.get("/stock/stats");
};

// 图片文件上传
export const uploadFiles = (data) => {
  return http.post("/uploadFiles", data);
};

// Excel导入
export const importExcel = (data) => {
  return http.post("/importExcel", data);
};

// 请求首页数据
export const getData = () => {
  return http.get("/home/getData");
};

// 通知
export const getNotifications = (params) => {
  return http.get("/notification/message/list", { params });
};
export const readNotification = (data) => {
  return http.post("/notification/message/mark-read", data);
};

// 通知模板
export const getNotificationTemplateList = (params) => {
  return http.get("/notification/template/list", { params });
};
export const getNotificationTemplateDetail = (params) => {
  return http.get("/notification/template/detail", { params });
};
export const addNotificationTemplate = (data) => {
  return http.post("/notification/template/add", data);
};
export const updateNotificationTemplate = (data) => {
  return http.post("/notification/template/update", data);
};
export const deleteNotificationTemplate = (data) => {
  return http.post("/notification/template/delete", data);
};

// 站内信
export const getSiteMessageList = (params) => {
  return http.get("/notification/message/list", { params });
};
export const getSiteMessageDetail = (params) => {
  return http.get("/notification/message/detail", { params });
};
export const sendSiteMessage = (data) => {
  return http.post("/notification/message/send", data);
};
export const markSiteMessageRead = (data) => {
  return http.post("/notification/message/mark-read", data);
};

// 操作日志
export const getLogList = (params) => {
  return http.get("/log/list", { params });
};
export const getLogDetail = (params) => {
  return http.get("/log/detail", { params });
};
export const deleteLog = (data) => {
  return http.post("/log/delete", data);
};

// 数据仪表盘
export const getDashboardData = () => {
  return http.get("/data-analysis/dashboard");
};

// 售后
export const getAfterSalesList = (params) => {
  return http.get("/after-sales/admin/list", { params });
};
export const approveAfterSales = (data) => {
  return http.post("/after-sales/admin/approve", data);
};
export const rejectAfterSales = (data) => {
  return http.post("/after-sales/admin/reject", data);
};

// 营销活动 - 优惠券
export const getCouponList = (params) => {
  return http.get("/marketing/coupon/list", { params });
};
export const getCouponDetail = (params) => {
  return http.get("/marketing/coupon/detail", { params });
};
export const createCoupon = (data) => {
  return http.post("/marketing/coupon/add", data);
};
export const updateCoupon = (data) => {
  return http.post("/marketing/coupon/update", data);
};
export const deleteCoupon = (data) => {
  return http.post("/marketing/coupon/delete", data);
};
export const issueCoupon = (data) => {
  return http.post("/marketing/coupon/issue", data);
};
export const getCouponIssueLog = (params) => {
  return http.get("/marketing/coupon/issue-log", { params });
};

// 营销活动 - 秒杀
export const getFlashSaleList = (params) => {
  return http.get("/marketing/flash-sale/list", { params });
};
export const getFlashSaleDetail = (params) => {
  return http.get("/marketing/flash-sale/detail", { params });
};
export const createFlashSale = (data) => {
  return http.post("/marketing/flash-sale/add", data);
};
export const updateFlashSale = (data) => {
  return http.post("/marketing/flash-sale/update", data);
};
export const deleteFlashSale = (data) => {
  return http.post("/marketing/flash-sale/delete", data);
};
export const addFlashSaleItem = (data) => {
  return http.post("/marketing/flash-sale/add-item", data);
};
export const updateFlashSaleItem = (data) => {
  return http.post("/marketing/flash-sale/update-item", data);
};
export const deleteFlashSaleItem = (data) => {
  return http.post("/marketing/flash-sale/delete-item", data);
};

// 财务管理 - 对账
export const getFinanceList = (params) => {
  return http.get("/finance/list", { params });
};
export const getFinanceDetail = (params) => {
  return http.get("/finance/detail", { params });
};
export const getFinanceDetailItems = (params) => {
  return http.get("/finance/detail-items", { params });
};
export const getFinanceOverview = () => {
  return http.get("/finance/overview");
};
export const financeExport = (params) => {
  const token = Cookie.get('token')
  const query = new URLSearchParams(params).toString()
  return fetch(`/api/finance/export?${query}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.blob()).then(blob => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `finance_${params.id}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  })
};
export const financeGenerate = (data) => {
  return http.post("/finance/generate", data);
};

// 系统字典
export const getDictAdminTypes = () => {
  return http.get("/dict/admin/types");
};
export const getDictAdminList = (typeCode) => {
  return http.get(`/dict/admin/list/${typeCode}`);
};
export const getDictList = (typeCode) => {
  return http.get(`/dict/type/${typeCode}`);
};
export const createDictItem = (typeCode, data) => {
  return http.post(`/dict/type/${typeCode}`, data);
};
export const updateDictItem = (id, data) => {
  return http.put(`/dict/item/${id}`, data);
};
export const deleteDictItem = (id) => {
  return http.delete(`/dict/item/${id}`);
};

// 物流管理
export const shipOrder = (data) => {
  return http.post("/logistics/ship", data);
};
export const getLogisticsPending = (params) => {
  return http.get("/logistics/pending", { params });
};
export const getLogisticsList = (params) => {
  return http.get("/logistics/list", { params });
};
export const getLogisticsDetail = (order_id) => {
  return http.get("/logistics/detail", { params: { order_id } });
};
export const signLogistics = (data) => {
  return http.post("/logistics/sign", data);
};

// 退货单管理
export const getReturnList = (params) => {
  return http.get("/logistics/return/list", { params });
};
export const getReturnDetail = (params) => {
  return http.get("/logistics/return/detail", { params });
};
export const addReturn = (data) => {
  return http.post("/logistics/return/add", data);
};
export const updateReturn = (data) => {
  return http.post("/logistics/return/update", data);
};
export const signReturn = (data) => {
  return http.post("/logistics/return/sign", data);
};
export const warehousingReturn = (data) => {
  return http.post("/logistics/return/warehousing", data);
};
export const deleteReturn = (data) => {
  return http.post("/logistics/return/delete", data);
};

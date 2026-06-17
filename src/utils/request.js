import Axios from "axios"
import {Message} from 'element-ui'
import Cookie from 'js-cookie'

const http = new Axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
http.interceptors.request.use(function (config) {
  const token = Cookie.get('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, function (error) {
  return Promise.reject(error)
})
// 响应拦截器
http.interceptors.response.use(function (response) {
  // 对响应数据做些什么
  if (response.status === 200) {
    const { code, data: result, message } = response.data
    if (code === 200) {
      return result
    } else {
      Message({
        type: 'error',
        message: message
      });
      console.error(message);
    }
  }
}, function (error) {
  // 响应错误时
  return Promise.reject(error)
})

export default http

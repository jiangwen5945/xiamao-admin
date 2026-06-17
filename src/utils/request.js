import Axios from "axios"
import {Message} from 'element-ui'

const http = new Axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
http.interceptors.request.use(function (config) {
  // 发送请求前做些什么
  return config
}, function (error) {
  // 请求错误时
  return Promise.reject(error)
})
// 响应拦截器
http.interceptors.response.use(function (response) {
  // 对响应数据做些什么
  if (response.status === 200) {
    const { code, result, message } = response.data
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

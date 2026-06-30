import Axios from "axios"
import {Message} from 'element-ui'
import Cookie from 'js-cookie'

let isRedirecting = false

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
      return result || {}
    } else {
      Message({ type: 'error', message });
      return Promise.reject(new Error(message))
    }
  }
  return Promise.reject(new Error('请求失败'))
}, function (error) {
  if (error.response && error.response.status === 401) {
    if (!isRedirecting) {
      isRedirecting = true
      Cookie.remove('token')
      Message({ type: 'warning', message: '登录已过期，请重新登录' })
      window.location.href = '/#/login'
    }
    return Promise.reject(error)
  }
  Message({ type: 'error', message: '网络异常，请稍后重试' })
  return Promise.reject(error)
})

export default http

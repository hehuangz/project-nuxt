import Vue from 'vue'
import axios from 'axios'
let service = axios.create({
  timeout: 5000,
  // 前缀
  baseURL: '/api'
})

Vue.prototype.$http = service

export const http = service

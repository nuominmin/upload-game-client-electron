import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    { path: '/upload', name: 'upload', component: resolve => require(['@/components/upload/index'], resolve) },
    { path: '/envConfig', name: 'envConfig', component: resolve => require(['@/components/envConfig/index'], resolve) },
    { path: '/productConfig', name: 'productConfig', component: resolve => require(['@/components/productConfig/index'], resolve) },
    { path: '', redirect: "upload" },
  ]
})

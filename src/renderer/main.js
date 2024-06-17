import Vue from 'vue'
import http from 'request-promise'
import App from './App'
import router from './router'
import store from './store'
import Uuid from 'vue-uuid'
import { Modal, Button, Table, Row, Col, Progress, Badge, Space, message, Popover, Input, InputNumber } from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';
import pkg from '../../package';
import { ipcRenderer } from 'electron'
import { getUserInfo, getUserToken, getUserSuper } from '../main/index.util';

Vue.use(Button);
Vue.use(Table);
Vue.use(Row);
Vue.use(Col);
Vue.use(Progress);
Vue.use(Badge);
Vue.use(Uuid)
Vue.use(Space)
Vue.use(Popover)
Vue.use(Modal)
Vue.use(Input)
Vue.use(InputNumber)
if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.prototype.$http = http;
Vue.http = Vue.prototype.$http;
Vue.prototype.$message = message;
message.config({
  duration: 2,// 持续时间
  top: `100px`, // 到页面顶部距离
  maxCount: 1 // 最大显示数, 超过限制时，最早的消息会被自动关闭
});
Vue.config.productionTip = false;
Vue.prototype.$apiURL = process.env.NODE_ENV === 'development' ? pkg.dev.apiURL : "http://192.168.1.10:12021/"

// getUserInfo 获取缓存的用户数据
Vue.prototype.$getUserInfo = getUserInfo

// 获取玩家super
Vue.prototype.$getUserSuper = getUserSuper

// 获取玩家token
Vue.prototype.$getUserToken = getUserToken

// 检查响应授权
Vue.prototype.$checkResponseAuth = function (response) {
  if (response.code == -13) {
    ipcRenderer.send("not login");
  }
}


new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')

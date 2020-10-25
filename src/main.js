import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import models from './db/models'
import moment from 'moment'
import './plugins/element.js'
import './plugins/jsonExcel.js'
import './utils/directives'

import '@/assets/icon/iconfont.css'

Vue.config.productionTip = false
Vue.prototype.$models = models
Vue.prototype.$toJson = (data) => {
  return JSON.parse(JSON.stringify(data, null, 2))
}
Vue.prototype.$formatTime = (value, format = 'YYYY-MM-DD HH:mm:ss') => {
  return moment(value).format(format)
}

Vue.filter('parseTime', function (value, format = 'YYYY-MM-DD HH:mm:ss') {
  return moment(value).format(format)
})

// Promise.resolve().then(() => {
//   return Promise.all([
//     require('./db/init').default()
//   ])
// }).then(() => {
//   new Vue({
//     router,
//     store,
//     render: h => h(App)
//   }).$mount('#app')
// })

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')

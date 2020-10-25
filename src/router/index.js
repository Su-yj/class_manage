import Vue from 'vue'
import VueRouter from 'vue-router'
import Layout from '@/components/Layout/Layout'

Vue.use(VueRouter)

export const routes = [
  {
    path: '/',
    name: 'Login',
    component: () => import(/* webpackChunkName: "login" */ '@/views/Login/Login'),
    meta: { title: '密码登录' }
  },
  {
    path: '/index',
    name: 'Layout',
    component: Layout,
    redirect: '/schedule',
    children: [
      {
        path: '/schedule',
        name: 'Schedule',
        component: () => import('@/views/Schedule/Schedule'),
        meta: { title: '课表', icon: 'el-icon-third-kechengbiao' }
      },
      {
        path: '/schedule-list',
        name: 'ScheduleList',
        component: () => import('@/views/ScheduleList/ScheduleList'),
        meta: { title: '排课表', icon: 'el-icon-third-kechengbiao' }
      },
      {
        path: '/trusteeship',
        name: 'Trusteeship',
        component: () => import('@/views/Trusteeship/Trusteeship'),
        meta: { title: '托管', icon: 'el-icon-third-tuoguan' }
      },
      {
        path: '/others',
        name: 'Others',
        component: () => import('@/views/Others/Others'),
        meta: { title: '其他', icon: 'el-icon-third-qitashouru' }
      },
      {
        path: '/student',
        name: 'Student',
        component: () => import('@/views/Student/Student'),
        meta: { title: '学生', icon: 'el-icon-third-xuesheng' }
      },
      {
        path: '/teacher',
        name: 'Teacher',
        component: () => import('@/views/Teacher/Teacher'),
        meta: { title: '老师', icon: 'el-icon-third-jiaolian1' }
      },
      {
        path: '/course',
        name: 'Course',
        component: () => import('@/views/Course/Course'),
        meta: { title: '课程', icon: 'el-icon-third-kechengguanli' }
      },
      {
        path: '/analysis',
        name: 'Analysis',
        component: () => import('@/views/Analysis/Analysis'),
        meta: { title: '统计', icon: 'el-icon-third-kechengbiao' }
      }
    ]
  }
]

const router = new VueRouter({
  routes
})

export default router

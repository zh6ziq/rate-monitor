import { createRouter, createWebHistory } from 'vue-router'
import Home from './pages/Home.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/gold', component: () => import('./pages/Gold.vue') },
    { path: '/converter', component: () => import('./pages/Converter.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

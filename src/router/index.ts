import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/home/my-home.vue'),
  },
  {
    path: '/chat',
    name: 'chatPage',
    component: () => import('@/views/home/chat-page.vue'),
  },
]
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})
export default router

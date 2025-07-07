import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            component: HomeView,
            children: [
                {
                    path: '',
                    name: 'home',
                    redirect: '/qr-Barcode',
                },
                {
                    path: '/qr-barcode',
                    name: 'qr Barcode',
                    component: () => import('@/views/GenerateQRBarcode.vue'),
                    children: [
                        { path: '', name: 'form', component: () => import('@/components/qr-bar-code/Form.vue'), },
                        { path: 'output', name: 'output', component: () => import('@/components/qr-bar-code/Output.vue'), }
                    ]
                },
                {
                    path: '/isa',
                    name: 'isa',
                    component: () => import('@/components/home/School.vue'),
                    children: []
                },
                {
                    path: '/generate-password',
                    name: 'generate password',
                    component: () => import('@/views/GeneratePassword.vue'),
                    children: []
                }
            ],
        }, 
        {
            path: '/about',
            name: 'about',
            component: () => import('@/views/AboutView.vue'),
            meta: {
                title: 'About Us',
                favicon: '/favicons/IconIB.svg'
            }
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'page-not-found',
            component: () => import("@/views/PageNotFoundView.vue"),
            meta: {
                title: 'Page not found',
                favicon: '/favicons/IconIB.svg'
            }
        }, 
    ]
})

function updateFavicon(iconUrl) {
  let link = document.querySelector("link[rel~='icon']");
  
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }

  link.href = iconUrl;
}

//Dynamically Change Page Title
router.beforeEach((to, from) => {
    document.title = to.meta?.title ?? 'Default Title'

    // Update the favicon if provided
    if (to.meta?.favicon) {
        updateFavicon(to.meta.favicon);
    } else {
        updateFavicon('vite.svg'); // fallback
    }
})

export default router
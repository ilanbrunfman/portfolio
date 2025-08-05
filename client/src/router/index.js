import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            component: HomeView,
            name: 'home',
            children: [
                // {
                //     path: '',
                //     name: 'home',
                //     redirect: '/qr-Barcode',
                // },
                // {
                //     path: '/qr-barcode',
                //     name: 'qr Barcode',
                //     component: () => import('@/views/GenerateQRBarcode.vue'),
                //     children: [
                //         { path: '', name: 'form', component: () => import('@/components/qr-bar-code/Form.vue'), },
                //         { path: 'output', name: 'output', component: () => import('@/components/qr-bar-code/Output.vue'), }
                //     ]
                // },
                // {
                //     path: '/isa',
                //     // name: 'isa',
                //     component: () => import('@/views/ISA.vue'),
                //     children: [
                //         {
                //             path: '',
                //             redirect: '/isa/overview',
                //         },
                //         {
                //             path: '/isa/overview',
                //             name: 'Overview',
                //             component: () => import('@/components/isa/Overview.vue'),
                //         },
                //         {
                //             path: '/isa/access',
                //             component: () => import('@/components/isa/Access.vue'),
                //             children: [
                //                 {
                //                     path: '',
                //                     name: 'Access',
                //                     redirect: '/isa/access/efficacy',
                //                 },
                //                 {
                //                     path: '/isa/access/efficacy',
                //                     name: 'Efficacy',
                //                     component: () => import('@/components/isa/Efficacy.vue'),
                //                 },
                //                 // {
                //                 //     path: '/isa/access/moa',
                //                 //     name: 'MOA',
                //                 //     component: () => import('@/components/isa/MOA.vue'),
                //                 // }
                //             ],
                //         },
                //         {
                //             path: '/isa/support',
                //             component: () => import('@/components/isa/Support.vue'),
                //             children: [
                //                 {
                //                     path: '',
                //                     name: 'Support',
                //                     redirect: '/isa/support/dosing',
                //                 },
                //                 {
                //                     path: '/isa/support/dosing',
                //                     name: 'Dosing',
                //                     component: () => import('@/components/isa/Dosing.vue'),
                //                 },
                //                 {
                //                     path: '/isa/support/moa',
                //                     name: 'MOA',
                //                     component: () => import('@/components/isa/MOA.vue'),
                //                 }
                //             ],
                //         },
                //         {
                //             path: '/isa/summary',
                //             name: 'Summary',
                //             component: () => import('@/components/isa/Summary.vue'),
                //         }
                //     ]
                // },
                // {
                //     path: '/generate-password',
                //     name: 'generate password',
                //     component: () => import('@/views/GeneratePassword.vue'),
                //     children: []
                // }
            ],
            meta: {
                title: 'Home',
                favicon: '/favicons/IconIB.svg'
            }
        }, 
        {
            path: '/qr-barcode',
            name: 'qr Barcode',
            component: () => import('@/views/GenerateQRBarcode.vue'),
            meta: {
                title: 'Generate QR Code',
                favicon: '/favicons/IconIB.svg'
            }
        },
        {
            path: '/generate-password',
            name: 'generate password',
            component: () => import('@/views/GeneratePassword.vue'),
            meta: {
                title: 'Generate Password',
                favicon: '/favicons/IconIB.svg'
            }
        },
        {
            path: '/isa',
            // name: 'isa',
            component: () => import('@/views/ISA.vue'),
            children: [
                {
                    path: '',
                    redirect: '/isa/overview',
                },
                {
                    path: '/isa/overview',
                    name: 'Overview',
                    title: 'Overview',
                    component: () => import('@/components/isa/pages/overview/Overview.vue'),
                    meta: {
                        title: 'ISA - Overview',
                    },
                },
                {
                    path: '/isa/patient',
                    name: 'Patient',
                    title: 'Patient Profile',
                    component: () => import('@/components/isa/pages/patient/Patient.vue'),
                    meta: {
                        title: 'ISA - Patient',
                    }
                },
                {
                    path: '/isa/support',
                    component: () => import('@/components/isa/pages/support/Support.vue'),
                    title: 'Support',
                    children: [
                        {
                            path: '',
                            name: 'Support',
                            redirect: '/isa/support/approved-email',
                        },
                        {
                            path: '/isa/support/approved-email',
                            name: 'Approved Email',
                            title: 'Approved Email',
                            component: () => import('@/components/isa/pages/support/children/ApprovedEmail.vue'),
                            meta: {
                                title: 'ISA - Support/Approved Email',
                            },
                        },
                        {
                            path: '/isa/support/medical-inquiry',
                            name: 'Medical Inquiry',
                            title: 'Medical Inquiry',
                            component: () => import('@/components/isa/pages/support/children/MedicalInquiry.vue'),
                            meta: {
                                title: 'ISA - Support/Medical Inquiry',
                            },
                        },
                        {
                            path: '/isa/support/efficacy',
                            name: 'Efficacy',
                            title: 'Order',
                            component: () => import('@/components/isa/pages/support/children/Order.vue'),
                            meta: {
                                title: 'ISA - Support/Order',
                            },
                        },
                    ],
                },
                {
                    path: '/isa/dosing',
                    name: 'Dosing',
                    title: 'Dosing Calculator',
                    component: () => import('@/components/isa/pages/dosing/Dosing.vue'),
                    meta: {
                        title: 'ISA - Dosing',
                    }
                },
                {
                    path: '/isa/summary',
                    name: 'Summary',
                    title: 'Summary',
                    component: () => import('@/components/isa/pages/summary/Summary.vue'),
                    meta: {
                        title: 'ISA - Summary',
                    }
                }
            ],
            meta: {
                favicon: '/favicons/abbvie_icon.png'
            },
        },
        {
            path: '/about',
            name: 'about',
            component: () => import('@/views/AboutView.vue'),
            meta: {
                title: 'About',
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
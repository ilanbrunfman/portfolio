import { defineStore } from 'pinia'

export const useStore = defineStore('store', {
      // data
    state: () => ({
        count: 0,
    }),
    // methods
    actions: {},
    // computed
    getters: {},
})
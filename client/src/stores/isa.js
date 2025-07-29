import { defineStore } from 'pinia'

export const useStore = defineStore('storeISA', {
    // data
    state: () => ({
        modalArray: [],
    }),
    // methods
    actions: {

        ilan(){
            console.log('ilan form isa')
        },
        setState(props) {
            if( typeof props.stateName === 'string' ) {
                this[props.stateName] = props.value
                this.targetState = this[props.stateName]
            } else {
                console.warn("Cannot set state with a payload.prop that isn't a string or an array of strings");
            }
        },

        ADD_MODAL(state) {
            const existingIndex = this.modalArray.findIndex(modal => modal.id === state.id)

            if (existingIndex !== -1) {
                // Modal with the same ID already exists — remove it (toggle off)
                this.modalArray.splice(existingIndex, 1)
                return
            }

            // Only allow one modal at a time — remove the current one
            if (this.modalArray.length > 0) {
                this.modalArray.pop()
            }

            // Add the new modal with a generated or given ID
            this.modalArray.push({
                id: state.id || this.generateId(),
                active: true,
                ...state,
            })
        },

        REMOVE_MODAL() {
            console.log('REMOVE_MODAL',  this.modalArray)
            this.modalArray.pop()
        },

        generateId() {
            return Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        }, 
    },
    // computed
    getters: {},
})
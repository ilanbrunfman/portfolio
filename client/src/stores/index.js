import { defineStore } from 'pinia'

export const useStore = defineStore('store', {
      // data
    state: () => ({
        count: 0,
        data: [
            { 
                id: '1234', 
                path: '/qr-barcode', 
                title: 'Generate QR Barcode', 
                para: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.', 
            },
            // { 
            //     id: '4321', 
            //     path: '/isa', 
            //     title: 'School project',
            //     para: 'Lorem Ipsum is simply dummy text typesetting industry.',
            // },
            { 
                id: 'abc3', 
                path: '/generate-password', 
                title: 'Generate Password', 
                para: 'Lorem Ipsum is simply dummy text.', 
            },
        ],
        toast: false,
        password: [],
    }),
    // methods
    actions: {
        setState(props) {
            if( typeof props.stateName === 'string' ) {
                this[props.stateName] = props.value
                this.targetState = this[props.stateName]
            } else {
                console.warn("Cannot set state with a payload.prop that isn't a string or an array of strings");
            }
        },

        setToast(toast) {
            this.toast = toast
            setTimeout(() => {this.toast = false}, 3000);
        },

        generateId() {
            return Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        }, 

        // Fetch Passowrd
        async fetchPassword() {
            try {
                const response = await fetch('/api/password') // const response = await fetch('http://localhost:5000/users')
                const data = await response.json()
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                this.password = data
            } catch (error) {
                console.error('Error fetching password list', error);
            }
        },

        // Add Password
        async addPassword(data) {
            this.password.push(data)
            
            const response = await fetch('/api/password', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            })
            
            if (response.error) {
                console.log(response.error)
                setTimeout(() => { this.setToast({ type: 'error' }) }, 100);
            }
        },

        // Delete password
        async deletePassword(data) {
            console.log('deletePassword', data)
            
            // delete p from password
            this.password = this.password.filter((p) => p.id !== data.id)
            try {
                const response = await fetch('/api/password/' + data.id, {
                    method: 'DELETE'
                })
                if (!response.ok) {
                    // Server returned an error status
                    const errorData = await response.json()
                    console.error('API error:', errorData)

                    setTimeout(() => {
                        this.setToast({ type: 'error', message: errorData.message || 'Something went wrong' })
                    }, 100)
                } else {
                    console.log('User has been deleted successfully', data)
                }
            } catch (error) {
                console.error('Fetch failed:', error)

                setTimeout(() => {
                    this.setToast({ type: 'error', message: 'Network error while saving archive' })
                }, 100)
            }
        },
    },
    // computed
    getters: {},
})
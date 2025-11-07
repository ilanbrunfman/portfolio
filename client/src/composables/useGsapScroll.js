import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)

export function useGsapScroll() {  
    const containerRef = ref(null)
    let gsapContext = null

    onMounted(async () => {
        await nextTick()
        gsapContext = gsap.context(() => {
                const elems = gsap.utils.toArray('[data-animate]')
                elems.forEach((el) => {
                    gsap.from(el, { 
                        alpha: 0, y: 40, duration: 0.9, ease: 'power3.out', stagger: 0.25, 
                        scrollTrigger: { trigger: el, start: 'top 85%',  end: 'bottom 10%', toggleActions: 'play none none reverse', markers: false, }, 
                    })
                })
        }, containerRef.value) // scope selectors within containerRef
    })

    onBeforeUnmount(() => {
        if (gsapContext) gsapContext.revert() // revert will remove registered tweens and ScrollTriggers created within context
        ScrollTrigger.getAll().forEach(st => st.kill()) // For safety, kill all ScrollTriggers (optional)
    })

    return { containerRef }
}
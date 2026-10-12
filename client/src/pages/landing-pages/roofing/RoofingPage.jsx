import LandingHeader from '@/pages/landing-pages/_shared/sections/LandingHeader'
import Hero from '@/pages/landing-pages/_shared/sections/Hero'
import TrustBar from '@/pages/landing-pages/_shared/sections/TrustBar'
import FeatureGrid from '@/pages/landing-pages/_shared/sections/FeatureGrid'
import Stats from '@/pages/landing-pages/_shared/sections/Stats'
import MediaSplit from '@/pages/landing-pages/_shared/sections/MediaSplit'
import Testimonials from '@/pages/landing-pages/_shared/sections/Testimonials'
import CTA from '@/pages/landing-pages/_shared/sections/CTA'
import ContactForm from '@/pages/landing-pages/_shared/sections/ContactForm'
import LandingFooter from '@/pages/landing-pages/_shared/sections/LandingFooter'
import { roofingContent as c } from './roofing.data'
import styles from './Roofing.module.scss'

const RoofingPage = () => (
    <div id="top" className={styles.page}>
        <LandingHeader brand={c.brand} nav={c.nav} phone={c.phone} cta={c.headerCta} />

        <main>
            <Hero {...c.hero} />
            <TrustBar items={c.trust} />
            <FeatureGrid id="services" {...c.services} />
            <Stats items={c.stats} />
            <MediaSplit id="about" {...c.about} reverse />
            <FeatureGrid id="why" {...c.why} />
            <Testimonials id="reviews" {...c.testimonials} />
            <CTA {...c.cta} phone={c.phone} />
            <ContactForm id="contact" {...c.contact} phone={c.phone} />
        </main>

        <LandingFooter {...c.footer} />
    </div>
)

export default RoofingPage

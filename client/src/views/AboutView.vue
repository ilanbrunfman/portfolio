<script setup>
import { ref } from 'vue'

import Wrapper from '@/components/shared/Wrapper.vue'
import IconArrowLeft from '@/components/icons/IconArrowLeft.vue'
import IconUser from '@/components/icons/IconUser.vue'
import CardExperience from '@/components/about/Cards/CardExperience.vue'
import CardEducation from '@/components/about/Cards/CardEducation.vue'
import Tags from '@/components/about/tags/Tags.vue'

const information = ref([
    // `Software Engineer Front End, Web Developer, Web & Graphic Designer, Freelancer, and UI/UX Designer. A graduate student with a Master of Science in Computer Science at the University of Central Missouri and a Bachelor of Arts in Interactive Media and Web Design at Lindenwood University. I like to resolve design problems, create smart user interfaces and imagine useful interactions. Spearhead interactive projects in individual and group settings.`,
    // `My goals are to continue to challenge my abilities. I keep up to date with the latest trends and technologies of design and development. `,
    // `Collaborating with and learning from other people is another important part of my work ethic. My hard work and passion not only benefit me, but it also benefits and impacts others. I have always believed that along with hard work I can succeed in what I love doing.`,
    `I am a multidisciplinary Software Engineer with a strong focus on Frontend Development, UI/UX Design, and Web Technologies. I hold a Master of Science in Computer Science from the University of Central Missouri and a Bachelor of Arts in Interactive Media and Web Design from Lindenwood University.`,
    `Over the years, I've grown from a Web and Graphic Designer into a Senior Frontend Developer, working on interactive digital projects both independently and collaboratively. I specialize in creating smart, scalable interfaces and resolving complex design challenges.`,
    `My goal is to continually challenge myself while staying at the forefront of evolving web technologies. I thrive in collaborative environments and believe that hard work, passion, and continuous learning not only drive personal success but also bring value to teams and users alike.`
])

const experience = ref([
    { 
        logo: 'eversana_intouch_logo.jpeg', 
        title: 'Senior Frontend Developer', 
        company:'Eversana Intouch', 
        location: 'Overland Park, Kansas, United States',
        period: 'Aug 2020 - Present',
        status: true,
        active: false,
        role: [
            `<strong>Building compliant, modular CLM (Closed Loop Marketing) content</strong> using HTML, CSS, JavaScript, and Vue.js within Veeva Vault and Veeva CRM guidelines.`,
            `<strong>Customizing multichannel presentations</strong> using Adobe XD/Figma mockups to deliver interactive, responsive layouts compatible with iPad and mobile devices.`,
            `<strong>Developing and managing key media assets</strong>, such as PDFs, videos, and interactive modules, ensuring consistency across brands and therapeutic areas.`,
            `<strong>Collaborating with cross-functional teams</strong> (brand managers, MLR reviewers, medical, regulatory) to ensure that all assets meet compliance, legal, and brand requirements.`,
            `<strong>Packaging content in ZIP format (Presentation + Key Messages)</strong>, validating functionality using Veeva’s CLM Previewer, and deploying through Veeva Vault PromoMats.`,
            `<strong>Conducting QA testing</strong> on different Veeva-supported devices (iPad, Windows) to ensure pixel-perfect rendering and user experience across all environments.`,
            `<strong>Troubleshooting CRM sync issues</strong>, Veeva message flow, and Salesforce/Veeva metadata dependencies.`

            
        ]
    },
    { 
        logo: 'IconIB.svg', 
        title: 'Web Developer ', 
        company:'Freelance', 
        location: 'Overland Park, Kansas, United States',
        period: 'Aug 2018 - Jul 2020',
        status: false,
        active: false,
        role: [
            `<strong>Designing and developing responsive websites</strong> using HTML, CSS, JavaScript, and modern frameworks like Vue.js and React.js.`,
            `<strong>Building custom WordPress themes and plugins</strong> tailored to client requirements, including SEO best practices and performance enhancements.`,
            `<strong>Creating engaging user interfaces and design systems</strong>, informed by UX research and built with tools like Figma, Adobe XD, and Photoshop.`,
            // `<strong>Implementing front-end animations and interactions</strong>, using GSAP, CSS transitions, and JavaScript for dynamic experiences.`,
            `<strong>Collaborating with clients and stakeholders</strong> to define project goals, scope, and timelines, and deliver high-quality solutions on time and budget.`,
            `<strong>Maintaining, updating, and optimizing existing sites</strong>, including legacy code refactors and mobile-first responsiveness.`,
            `<strong>Setting up hosting environments</strong>, DNS configurations, and deploying projects using platforms like Netlify, Vercel, and traditional cPanel/FTP.`,
            `<strong>Integrating APIs and third-party services</strong>, such as email marketing platforms, or headless CMS solutions.`
        ]
    },
])

const educations = ref([
    { 
        logo: 'lu_logo.jpeg', 
        title: 'Master of Computer Applications - MCA, Computer Science', 
        location: 'University of Central Missouri', 
        period: '2017 - 2018',
        active: false, 
    },
    { 
        logo: 'ucm_logo.jpeg', 
        title: 'Bachelor of Arts (BA), Graphic Design', 
        location: 'Lindenwood University', 
        period: '2013 - 2016',
        active: false, 
    },
])


const skills = ref([
    { name: 'HTML' },
    { name: 'CSS' },
    { name: 'Veeva CRM' },
    { name: 'Vault PromoMats' },
    { name: 'JavaScript' },
    { name: 'TypeScript' },
    { name: 'Vue.js' },
    { name: 'React.js' },
    { name: 'AngularJS' },
    { name: 'jQuery' },
    { name: 'Java' },
    { name: 'C#' },
    { name: 'SCSS' },
    { name: 'Azure DevOps' },
    { name: 'Git' },
    { name: 'GitHub' },
    { name: 'ChatGPT' },
    { name: 'WordPress' },
    { name: 'Responsive Design' },
    { name: 'UX/UI Desing' },
    { name: 'Figma' },
    { name: 'Adobe XD' },
    { name: 'Adobe Photoshop' },
    { name: 'Adobe Illustrator' },
    { name: 'Adobe InDesign' },
])

// helper function outside <script setup> block if not using bundler alias
const getImagePath = (filename) => {
  return new URL(`../assets/images/${filename}`, import.meta.url).href
}

const toggleAccordion = (array, item) => {
    item.active = !item.active
//   array.forEach(entry => {
//     entry.active = entry === item ? !entry.active : false
//   })
}

</script>

<template>
    <Wrapper wrapperClass="about">
        <template #main>

            <div class="showcase">
                <div class="container mx-auto">
                    <div class="row">
                        <div class="col pb-5">
                            <h1 class="title fw-600 lh-1-0 mb-1">Ilan Brunfman</h1>
                            <h4 class="para fw-400 lh-1-0">Software Engineer <!--Senior Frontend Feveloper--> | <a href="https://www.eversanaintouch.com/" target="_blank" class="z">Eversana Intouch</a></h4>
                        </div>
                    </div>
                </div>
            </div>

            <div class="container mx-auto py-5">
                
                <div class="row">
                    <div class="col-12 col-lg-8 mb-2 mb-md-4">
                        <h3 class="sub-title fw-600 lh-1-0 mb-1 pb-0-5">About</h3>
                        <p v-for="(item, index) in information" :key="index" class="para fw-400 lh-1-5 mb-1">{{ item }}</p>
                    </div>
                </div>

                <div class="row">
                    <div class="col-12 col-lg-8 mb-2 mb-md-4">
                        <h3 class="sub-title fw-600 lh-1-0 mb-2">Work Experience</h3>
                        <card-experience 
                            :array="experience"
                            :getImagePath="getImagePath"
                            :toggleAccordion="toggleAccordion"
                        />
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-12 col-lg-8 mb-2 mb-md-4">
                        <h3 class="sub-title fw-600 lh-1-0 mb-2">Education</h3>
                        <card-education 
                            :array="educations"
                            :getImagePath="getImagePath"
                        />
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-12 col-lg-8 mb-2 mb-md-4">
                        <h3 class="sub-title fw-600 lh-1-0 mb-2">Skills</h3>
                        <tags :array="skills"/>
                    </div>
                </div>

            </div>

        </template>
    </Wrapper>
</template>
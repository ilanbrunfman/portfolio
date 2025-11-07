<script setup>
import { ref } from 'vue';
const schema = ref([
    {
        id: 'adimnID',
        label: 'Admin',
        child: [
            { 
                label: 'Teachers:',
                sub: [
                    { label: 'Create', },
                    { label: 'Delete', },
                    { label: 'Update', },
                ],
            },
            { 
                label: 'Students:',
                sub: [
                    { label: 'Classes', },
                    { label: 'Exams', },
                ],
            },
        ],
    },
    {
        id: 'studentID',
        label: 'Students',
        child: [
            {
                label: 'classes',
                sub: [
                    { label: 'Exams',},
                    { label: 'Assignemtns' }
                ],
            }
        ],
    },
    {
        id: 'teacherID',
        label: 'Teachers',
        child: [
            {
                label: 'Classes: ',
                sub: [
                    { label: 'Class', nested: [{ label: 'Students' }, { label: 'Exams' }, { label: 'Assignemtns' }]},
                    { label: 'Studens', nested: [{ label: 'Student' }]},
                ],
            },
            {
                label: 'Students:',
                sub: [
                    { label: 'Student', },
                    { label: 'Classes', nested: [
                        { label: 'Class', sub: [{ label: 'Students' }, { label: 'Exams' }, { label: 'Assignemtns' }]}, 
                    ]},
                ],
            }
        ],
    }
])

</script>

<template>
    <div class="container mx-auto">
        <div class="row">
            <div class="col-12 pt-6">
                <h1 class="mb-1">CRUD programming - Schema</h1>
                <ul>
                    <li v-for="(item, index) in schema" :key="index">
                        <span v-html="item.label"></span>
                        <ul v-if="item.child">
                            <li v-for="(child, c) in item.child" :key="c">
                                <span v-html="child.label"></span>
                                <ul v-if="child.sub">
                                    <li v-for="(sub, s) in child.sub" :key="s">
                                        <span v-html="sub.label"></span>
                                        <ul v-if="sub.nested">
                                            <li v-for="(nested, n) in sub.nested" :key="n">
                                                <span v-html="nested.label"></span>
                                                <ul v-if="nested.sub">
                                                    <li v-for="(sub, s) in nested.sub" :key="s">
                                                        <span v-html="sub.label"></span>
                                                    </li>
                                                </ul>
                                            </li>
                                        </ul>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    </div> 
</template>

<style lang="scss" scoped>
ul {
    padding-left: 15px;
    list-style-type: none;
    counter-reset: item;

    li {
        position: relative;
        counter-increment: item;
        line-height: 1.3;
        display: table;

        &::before{ 
            position: relative; 
            content: counters(item, ".") ". "; 
        }

        ul {
            padding-left: 15px;
            li {
                ul {
                    padding-left: 30px;
                    li {
                        ul {
                            padding-left: 45px;
                            li { 
                                ul { 
                                    padding-left: 55px; 
                                } 
                            }
                        }
                    }
                }
            }
        }
    }
}
</style>
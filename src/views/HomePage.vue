
<template>
    <navigation/>
    <card-content/>
</template>

<script>
import CardContent from '../components/CardContent.vue';
import Navigation from '../components/Navigation.vue';

export default {
    name: 'HomePage',

    components: {
        Navigation,
        CardContent
    }
}
</script>
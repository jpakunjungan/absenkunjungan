import './style.css'
import Notification from '@kyvg/vue3-notification';
import Camera from 'simple-vue-camera'
import { initializeApp } from 'firebase/app'
import { getAnalytics } from "firebase/analytics";
import firebaseConfig from './firebase'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
const app = createApp(App)

initializeApp(firebaseConfig);
getAnalytics();
app.use(Notification)
app.use(router)
app.component("camera", Camera)
app.mount('#app')

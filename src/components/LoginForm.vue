<template>
    <main class="bg-global bg-cover">
        <div class="flex justify-center h-screen w-screen max-sm:w-[360px] max-sm:mx-auto items-center flex-col">
            <h1 class="text-white font-bold text-[40px] py-4">Login Attendance</h1>
            <div class="w-full max-w-[500px]">
                <form class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                    <div class="mb-4">
                    <label 
                        class="block text-gray-700 text-sm font-bold mb-2" 
                        for="username"
                    >
                        Username
                    </label>
                    <input 
                        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                        id="username" 
                        type="text" 
                        placeholder="Username"
                        v-model="formData.username"
                    >
                    </div>
                    <div class="mb-6">
                    <label 
                        class="block text-gray-700 text-sm font-bold mb-2" 
                        for="password"
                    >
                        Password
                    </label>
                    <input 
                        class="shadow appearance-none border border-red-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" 
                        id="password" 
                        type="password" 
                        placeholder="*******"
                        v-model="formData.password"
                    >
                    <p class="text-red-500 text-xs italic">Masukan password dan username.</p>
                    </div>
                    <div class="flex items-center justify-between">
                    <button 
                        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full" 
                        type="button"
                        @click="login"
                    >
                        Login
                    </button>
                    </div>
                </form>
                <p class="text-center text-white text-md">
                    Webcam Attendance
                </p>
            </div>
        </div>
    </main>
</template>

<script>
import { getDatabase, ref, get } from 'firebase/database';

export default {
    name: 'LoginForm',

    data() {
        return {
            formData: {
                username: null,
                password: null
            }
        }
    },

    methods: {
        async login() {
            const db = getDatabase();
            const usersRef = ref(db, 'users');

        try {
            const snapshot = await get(usersRef);

        if (snapshot.exists()) {
            const allUserData = snapshot.val();

            for (const userId in allUserData) {
                const userData = allUserData[userId];
                if (
                    userData.username === this.formData.username &&
                    userData.password === this.formData.password
                ) {
                    this.$router.push({path:'/home', query: { username: this.formData.username}}); 
                    this.$notify({type: "success", text: "Login berhasil"})
                    return;
                }
            }
                this.$notify({type: 'error', text: "Username or password salah"});
            } else {
                this.$notify({type: "warn", text: "User tidak ditemukan"});
            }
            } catch (error) {
                this.$notify({text: 'Error 505', error});
            }
        },
    }
}
</script>
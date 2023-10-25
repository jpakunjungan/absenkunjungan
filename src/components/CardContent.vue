<template>
    <div class="flex flex-col max-w-[600px] max-sm:w-[350px] bg-blue-500 mx-auto text-center rounded-lg">
        <div class="flex justify-between items-center px-5">
            <h1 class="text-center py-5 font-bold">Camera Attendance</h1>
            <p class="font-bold">Hi! {{ this.$route.query.username }}</p>
        </div>
        <hr>
        <div>
            <camera 
                :resolution="{width: 375, heigh: 812}" 
                autoplay 
                ref="cameraRef"
            >
            <button
                @click="takeSnapshot"
                class="py-2 px-8 bg-green-500 rounded-lg absolute bottom-2 translate-x-[-50%]"
            >  
                <h1 class="font-bold text-[14px]">Capture</h1>
            </button>
            </camera>
        </div>
        <select 
            class="font-bold px-3 py-2"
            v-model="selectedCamera" 
            @change="changeCameraCam"
        >
            <option 
                v-for="device in availableCameras" 
                :key="device.deviceId" 
                :value="device.deviceId"
            >
                {{ device.label }}
            </option>
        </select>
        <hr>
        <div class="flex max-sm:flex-col items-center">
            <div class="text-left pl-4 w-full py-4 flex flex-col">
                <h1><span class="font-bold">DATE:</span> {{ formattedDate }}</h1>
                <h1><span class="font-bold">LOCATION:</span> {{ address }}</h1>
            </div>
            <div class="px-4 py-4 bg-origin-content">
                <img 
                    class="rounded-lg shadow-lg object-cover"
                    :src="snapshotUrl" 
                    v-if="snapshotUrl"
                    alt="Snapshot"
                    width="360"
                />
            </div>
        </div>
        <div class="pb-5 space-x-3">
            <button
                @click="sendAttend"
                class="py-2 px-8 bg-blue-900 rounded-lg"
            >
                <h1 class="font-bold text-[14px] text-white">Send Attend</h1>
            </button>
        </div>
    </div>
</template>

<script>
import {useGeolocation} from '@vueuse/core';
import axios from 'axios';
import { getDatabase, ref, push } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export default {
    name: 'CardComponent',

    data() {
        return {
            temporaryBlob: null,
            snapshotUrl: null,
            geolocationData: null,
            geolocation: useGeolocation(),
            formattedDate: null,
            address: null,
            selectedCamera: null, // to store the selected cam devices ID
            availableCameras: [] // to store the list of avail cam
        }
    },

    mounted() {
        let cameras = this.$refs.cameraRef.devices(['videoinput']);
        cameras.then((result) => {
            this.availableCameras = result
            this.selectedCamera = result[0].deviceId
        }).catch((err) => {
            console.log(err)
        });
    },

    watch: {
    geolocation: {
      deep: true,
      handler(value) {
        this.geolocationData = JSON.stringify(
          {
            coords: {
              accuracy: value.coords.accuracy,
              latitude: value.coords.latitude,
              longitude: value.coords.longitude,
              altitude: value.coords.altitude,
              altitudeAccuracy: value.coords.altitudeAccuracy,
              heading: value.coords.heading,
              speed: value.coords.speed,
            },
                locatedAt: value.locatedAt,
                error: value.error ? value.error.message : value.error,
            },
                null,
                2
            );
        },
        },
    },

    computed: {
        latitude() {
            return this.geolocation.coords ? this.geolocation.coords.latitude : null;
        },
        longitude() {
            return this.geolocation.coords ? this.geolocation.coords.longitude : null;
        },
    },

    methods: {
        async takeSnapshot() {
            const camera = this.$refs.cameraRef;

            if(camera) {
                let width, height;

                const userAgent = navigator.userAgent.toLowerCase();
                const isAndroid = userAgent.indexOf("android") > -1;
                const isIos = userAgent.indexOf("iphone") > -1 || userAgent.indexOf("ipad") > -1;

                if (isAndroid || isIos) {
                    width = 270;
                    height = 350;
                } else {
                    width = 360;
                    height = 270;
                }
                const blob = await camera.snapshot({width, height}, "image/png", 0.1); //todo fix image resoluiton

                if(blob) {
                    this.temporaryBlob = blob;
                    this.snapshotUrl = URL.createObjectURL(blob);
                    this.timeAttend();
                    this.getStreetName();
                }
            }
        },

        timeAttend() {
            const currentDate = new Date();
            const options = {year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'}
            this.formattedDate = currentDate.toLocaleDateString('en-US', options) //todo change indo timezone
        },

        async getStreetName() {
            const latitude = this.latitude
            const longitude = this.longitude
            try {
                const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            if (response.data && response.data.display_name) {
                const streetName = response.data.display_name;
                this.address = streetName;
            } else {
                console.error('Invalid response from the geocoding API.');
            }
            } catch (error) {
                console.error('Error fetching data from the geocoding API:', error);
            }
        },

        async changeCameraCam() {
            const camera = this.$refs.cameraRef;

            if (camera && this.selectedCamera) {
                try {
                    await camera.changeCamera(this.selectedCamera);
                } catch (error) {
                    console.error('Error change cam:', error);
                }
            }
        },

        async sendAttend() {
            const db = getDatabase();
            const attendancesRef = ref(db, 'attendances/AllDataAttendance'); // Change 'attendances' to your desired Firebase path

            if(
                !this.$route.query.username ||
                !this.address ||
                !this.formattedDate ||
                !this.snapshotUrl
            ) {
                this.$notify({type: "warn", text: "Capture Terlebih Dahulu"});
                return;
            }

            try {
                const downloadURL = await this.submitImageFirebase();

                const newAttendance = {
                    username: this.$route.query.username,
                    address: this.address,
                    formattedDate: this.formattedDate,
                    image: this.snapshotUrl,
                    imageUrl: downloadURL
                };

                await push(attendancesRef, newAttendance);
                
                this.$notify({type: "success", text: "Berhasil terkirim"});
            } catch (error) {
                console.error('Error mengirim attendance data', error);
                this.$notify({type: "error", text: "Gagal mengirim data"})
            }
        },

        async submitImageFirebase() {
            if(!this.temporaryBlob) {
                console.error('No image to submit');
                return;
            }

            try {
                // Generate a unique filename, e.g., based on date and time
                const currentDate = new Date();
                const username = this.$route.query.username;
                
                const year = currentDate.getFullYear();
                const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Add 1 because months are 0-based
                const day = currentDate.getDate().toString().padStart(2, '0');
                const formattedDate = `${year}-${month}-${day}`;

                const formattedTime = currentDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/[:\s]/g, '');
                const fileName = `${username}_${formattedDate}_${formattedTime}.png`;

                const storage = getStorage();
                const fileStorageRef = storageRef(storage, 'imagesStorage/' + fileName);

                // Upload the Blob to Firebase Storage
                await uploadBytes(fileStorageRef, this.temporaryBlob);

                // Get the download URL for the uploaded image
                const downloadURL = await getDownloadURL(fileStorageRef);

                // Optionally, you can save the downloadURL or perform other actions here

                console.log('Image uploaded. Download URL:', downloadURL);
                return downloadURL;
            } catch (error) {
                console.error('Error uploading image:', error);
            }
        }
    }
}

</script>
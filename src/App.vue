<template>
  <notifications
    class="my-notification"
    width="200"
  />
  <div class="bg-global w-screen h-screen bg-cover">
    <RouterView />
  </div>
</template>

<style>
.my-notification {
    margin: 0 5px 5px;
    padding: 10px;
    font-size: 12px;
    color: #ffffff;

    &.success {
        background: #68cd86;
        border-left-color: #42a85f;
    }
    &.info {
        background: #ffb648;
        border-left-color: #f48a06;
    }
    &.error {
        background: #e54d42;
        border-left-color: #b82e24;
    }
}

</style>
<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
import fs from 'fs'

export default {
  name: 'app',
  created () {
    this.$store.dispatch('loadConfig')
    window.fs = fs
  }
}
</script>

<style lang="scss" rel="stylesheet/scss">
  @import "~@/assets/scss/reset";
  @import "~@/assets/scss/global";
  @import "~@/assets/scss/config";
</style>

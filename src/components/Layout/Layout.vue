<template>
  <el-container class="layout">
    <el-header class="header" height="25px">
      <TopBar/>
    </el-header>
    <el-container class="container">
      <el-aside width="130px" class="aside">
        <SideMenu/>
        <div class="img-box" @click="changeImg">
          <img src="@/assets/images/bl0.png" alt="" v-if="currentImg===0">
          <img src="@/assets/images/bl1.png" alt="" v-if="currentImg===1">
          <img src="@/assets/images/bl2.png" alt="" v-if="currentImg===2">
          <img src="@/assets/images/bl3.png" alt="" v-if="currentImg===3">
          <img src="@/assets/images/bl4.png" alt="" v-if="currentImg===4">
          <img src="@/assets/images/bl5.png" alt="" v-if="currentImg===5">
          <img src="@/assets/images/bl6.png" alt="" v-if="currentImg===6">
          <img src="@/assets/images/bl7.png" alt="" v-if="currentImg===7">
          <img src="@/assets/images/bl8.png" alt="" v-if="currentImg===8">
        </div>
      </el-aside>
      <el-main class="main">
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import SideMenu from '@/components/Layout/SideMenu/SideMenu'
import TopBar from '@/components/TopBar/TopBar'

export default {
  name: 'Layout',
  components: {
    SideMenu,
    TopBar
  },
  data () {
    return {
      currentImg: 1
    }
  },
  created () {
    this.changeImg()
  },
  mounted () {
    this.$store.dispatch('updateStudentList')
    this.$store.dispatch('updateTeacherList')
    this.$store.dispatch('updateOrganizationList')
    this.$store.dispatch('backupDB')
  },
  methods: {
    changeImg () {
      this.currentImg = this.getRandomInt(0, 8)
    },
    getRandomInt (min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min
    }
  },
  watch: {
    $route () {
      this.changeImg()
    }
  }
}
</script>

<style scoped lang="scss" rel="stylesheet/scss">
  @import "../../assets/scss/config";
  .layout {
    height: 100%;
    min-width: 500px;
    .header {
      background: #212121;
    }
    .container {
      height: calc(100% - 60px);
      .aside {
        position: relative;
        height: 100%;
        background-color: $sidebarBgColor;
        .img-box {
          height: 160px;
          width: 100%;
          //background-color: #5daf34;
          position: absolute;
          bottom: 0;
          left: 0;
          img {
            width: 100%;
          }
        }
      }
      .main {
        height: 100%;
        overflow-x: hidden;
      }
    }
  }
</style>

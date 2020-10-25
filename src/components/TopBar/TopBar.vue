<template>
  <div class="top-bar">
    <span>{{ $route.meta.title }}</span>
    <div class="tools">
      <el-button type="text" icon="el-icon-lock" @click="lock" v-if="$route.name !== 'Login'"></el-button>
      <el-button type="text" icon="el-icon-minus" @click="minimize"></el-button>
      <el-button type="text" @click="maximize" :icon="isMax ? 'el-icon-third-zuidahua2' : 'el-icon-third-zuidahua'"></el-button>
      <el-button type="text" icon="el-icon-close" @click="close"></el-button>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { remote, ipcRenderer } from 'electron'

export default {
  name: 'TopBar',
  data () {
    return {
      win: remote.getCurrentWindow()
    }
  },
  computed: {
    ...mapState(['isMax'])
  },
  mounted () {
    ipcRenderer.on('isMax', (e, isMax) => {
      this.$store.dispatch('updateIsMax', isMax)
    })
  },
  methods: {
    // 锁定程序
    lock () {
      // 跳转至登录页面
      this.$router.push({ name: 'Login' })
    },
    // 点击最小化按钮调用的方法
    minimize () {
      // ipcRenderer.send('minimize')
      this.win.minimize()
    },
    // 最大化
    maximize () {
      // ipcRenderer.send('maximize')
      if (this.win.isMaximized()) {
        this.win.restore()
      } else {
        this.win.maximize()
      }
    },
    // 点击关闭按钮调用的方法
    close () {
      // ipcRenderer.send('close')
      this.win.close()
    }
  }
}
</script>

<style scoped lang="scss" rel="stylesheet/scss">
  .top-bar {
    -webkit-app-region: drag; // 可拖动
    -webkit-user-select: none;
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    height: 25px;
    line-height: 25px;
    background: #212734;
    padding: 0 20px;
    box-sizing: border-box;
    color: #eeeeee;
    span {
      /*-webkit-app-region: no-drag; // 不可拖动*/
      display: inline-block;
    }
    .tools {
      -webkit-app-region: no-drag; // 不可拖动
      position: absolute;
      top: 0;
      right: 0;
      z-index: 10;
      height: 25px;
      line-height: 25px;
      font-size: 18px;
      .el-button {
        padding: 0;
        color: #ffffff;
        line-height: 25px;
        height: 25px;
        width: 35px;
        font-size: 18px;
        font-weight: bold;
        margin: 0;
        &:hover {
          background: #5C5C67;
        }
        ::v-deep .el-icon-third-zuidahua1 {
          font-size: 14px !important;
        }
      }
    }
  }
</style>

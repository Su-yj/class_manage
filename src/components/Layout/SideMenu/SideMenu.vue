<template>
  <el-scrollbar wrap-class="scrollbar-wrap" style="height: 100%">
    <el-menu :default-active="$route.path" :background-color="config.sidebarBgColor" :text-color="config.sidebarTextColor" :active-text-color="config.sidebarActiveTextColor" class="menu" router>
      <el-menu-item v-for="(route, index) in routes[1]['children']" :index="route.path" :key="index">
        <i :class="route.meta.icon"></i>
        <span slot="title">{{route.meta.title}}</span>
      </el-menu-item>
    </el-menu>
  </el-scrollbar>
</template>

<script>
import config from '@/assets/scss/config.scss'
import { routes } from '@/router'

export default {
  name: 'Menu',
  data () {
    return {
      routes
    }
  },
  computed: {
    config () {
      return config
    }
  }
}
</script>

<style scoped lang="scss" rel="stylesheet/scss">
  @import "~@/assets/scss/config";
  ::v-deep .scrollbar-wrap {
    overflow-x: hidden;
  }
  .menu {
    //background: $sidebarBgColor;
    border-right: solid 1px $sidebarBgColor;
    .el-menu-item {
      &:hover {
        background: $sidebarHoverColor;
      }
    }
  }
</style>

import { getCurrentMonth } from '@/utils/index'

export const maxHeightReset = {
  data () {
    return {
      maxHeight: 500
    }
  },
  mounted () {
    this.getMaxHeight()
    window.onresize = () => {
      this.getMaxHeight()
    }
  },
  methods: {
    getMaxHeight () {
      this.$nextTick(() => {
        this.maxHeight = this.$el.offsetHeight
        if (this.$refs.searchFormRef && this.$refs.searchFormRef.$el.offsetHeight) {
          this.maxHeight -= this.$refs.searchFormRef.$el.offsetHeight
        }
        if (this.$refs.paginationRef && this.$refs.paginationRef.$el.offsetHeight) {
          this.maxHeight -= this.$refs.paginationRef.$el.offsetHeight
        }
      })
    }
  },
  beforeDestroy () {
    window.onresize = null
  }
}

export const formMixin = {
  props: {
    // 是否创建
    create: {
      type: Boolean,
      default: false
    },
    // 编辑时的数据
    data: {
      type: Object
    },
    // 外部的开关
    visible: {
      type: Boolean,
      default: false
    },
    // 是否append to body
    appendToBody: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      dialogVisible: this.visible, // 对话框开关
      submitLoading: false // 提交时的加载
    }
  },
  methods: {
    handleDialogClosed () {
      this.$emit('update:visible', false)
      this.$emit('closed')
    }
  },
  watch: {
    visible (value) {
      this.dialogVisible = value
    }
  }
}

export const monthChange = {
  methods: {
    // 获取当前搜索表单的月份
    getCurrentMonth () {
      let currentMonth = this.searchForm.month
      if (!currentMonth) {
        currentMonth = getCurrentMonth()
      }
      return currentMonth
    },
    // 上个月
    prevMonth (getPageDataMethod) {
      const currentMonth = this.getCurrentMonth()
      this.searchForm.month = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
      if (typeof getPageDataMethod === 'function') {
        getPageDataMethod()
      }
    },
    // 下个月
    nextMonth (getPageDataMethod) {
      const currentMonth = this.getCurrentMonth()
      this.searchForm.month = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
      if (typeof getPageDataMethod === 'function') {
        getPageDataMethod()
      }
    }
  }
}

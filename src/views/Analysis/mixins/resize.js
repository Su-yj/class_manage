import elementResizeDetectorMaker from 'element-resize-detector'

export default {
  data () {
    return {
      erd: elementResizeDetectorMaker(),
      maxHeight: 600
    }
  },
  mounted () {
    this.erd.listenTo(this.$el, () => {
      this.$nextTick(() => {
        this.getMaxHeight()
      })
    })
  },
  methods: {
    getMaxHeight () {
      this.maxHeight = this.$el.clientHeight - this.$refs.searchFormRef.$el.clientHeight
    }
  },
  beforeDestroy () {
    this.erd.uninstall(this.$el)
  }
}

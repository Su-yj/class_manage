<template>
  <div class="schedule-detail" :style="{left: left, top: top}" v-if="raw">
    <p>时间：{{schedule.startAt | parseTime('HH:mm')}} - {{schedule.endAt | parseTime('HH:mm')}}</p>
    <p>机构：{{schedule.Organization.name}}</p>
    <p>课程：{{schedule.name}}</p>
    <div v-if="!showDetailPrice">
      <p>老师：{{schedule.Teacher.name}}</p>
      <p>学生：{{schedule.StudentSchedules.map(item => item.Student.name).join(', ')}}</p>
    </div>
    <div v-else>
      <p>老师：{{schedule.Teacher.name}}({{schedule.teacherPrice}}元/小时)</p>
      <p>学生：{{schedule.StudentSchedules.map(item => `${item.Student.name}(${item.price}元/小时)`).join(', ')}}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ScheduleDetail',
  props: {
    raw: Object,
    showDetailPrice: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      left: 0,
      top: 0
    }
  },
  computed: {
    schedule () {
      if (this.raw) {
        return this.raw.event.extendedProps
      }
      return null
    }
  },
  methods: {
    getToolPosition () {
      window.document.documentElement.setAttribute('triangle-site', 'bottom')
      const el = this.raw.el
      const rect = el.getBoundingClientRect()
      const elWidth = el.offsetWidth
      const elHeight = el.offsetHeight
      const actualTop = rect.top - 25 - 20
      const actualLeft = rect.left - 130 - 20
      this.$nextTick(() => {
        const thisHeight = this.$el.offsetHeight
        const thisWidth = this.$el.offsetWidth
        this.top = actualTop - thisHeight - 10
        this.left = actualLeft + elWidth / 2 - thisWidth / 2
        if (this.top < -20) {
          this.top = actualTop + elHeight + 10
          window.document.documentElement.setAttribute('triangle-site', 'top')
        }
        this.top += 'px'
        this.left += 'px'
      })
    }
  },
  watch: {
    raw (value) {
      // console.log(this.$el)
      if (value) {
        this.getToolPosition()
      }
    }
  }
}
</script>

<style scoped lang="scss" rel="stylesheet/scss">
  @import "~@/assets/scss/variable.scss";
  @import "~@/assets/scss/mixin.scss";
  .schedule-detail {
    display: inline-block;
    //width: 170px;
    position: absolute;
    z-index: 9;
    background-color: $schedule_tool_bg_color;
    border: 1px solid $schedule_tool_border_color;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
    padding: 5px;
    box-sizing: border-box;
    &:before {
      @include schedule-tool-triangle-before();
    }
    &:after {
      @include schedule-tool-triangle-after();
    }
  }
</style>

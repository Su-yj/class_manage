<template>
  <div class="teacher-pane-page">
    <!--头部搜索框-->
    <el-form size="mini" ref="searchFormRef" inline :model="searchForm">
      <el-form-item>
        <el-button-group class="month-button-group">
          <el-button type="primary" icon="el-icon-arrow-left" @click="prevMonth(getExpendList)" title="上个月"></el-button>
          <el-button type="primary" icon="el-icon-arrow-right" @click="nextMonth(getExpendList)" title="下个月"></el-button>
        </el-button-group>
      </el-form-item>
      <el-form-item label="月份" prop="month">
        <el-date-picker v-model="searchForm.month" :editable="false" type="month" :clearable="false" style="width: 120px" @change="getExpendList"></el-date-picker>
      </el-form-item>
      <el-form-item prop="studentId" label="老师">
        <el-select v-model="searchForm.teacherId" clearable filterable placeholder="老师" style="width: 120px" @change="getExpendList">
          <el-option v-for="item in teacherList" :key="item.id" :label="item.name" :value="item.id"></el-option>
        </el-select>
      </el-form-item>
      <download-excel class="export-button" :data="expendList" :fields="jsonFields" :name="excelName">
        <el-button type="primary" size="mini" icon="el-icon-download">导出数据</el-button>
      </download-excel>
    </el-form>
    <!--老师支出表格-->
    <el-table :data="expendList" size="medium" style="width: 100%" :max-height="maxHeight" border stripe show-summary :summary-method="getSummaries">
      <el-table-column type="expand" align="center">
        <template slot-scope="{row}">
          <ScheduleTable :data="row.details" @submitted="handleScheduleSubmitted"/>
        </template>
      </el-table-column>
      <el-table-column label="老师" prop="name" align="center"></el-table-column>
      <el-table-column label="总课时" prop="hours" align="center">
        <template slot-scope="{row}">
          {{row.hours}} 小时
        </template>
      </el-table-column>
      <el-table-column label="总课时费" prop="schedulePrice" align="center">
        <template slot-scope="{row}">
          {{row.schedulePrice}} 元
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { getCurrentMonth } from '@/utils'
import { Op } from 'sequelize'
import { mapState } from 'vuex'
import resize from '@/views/Analysis/mixins/resize'
import ScheduleTable from '@/components/ScheduleTable/ScheduleTable'
import { monthChange } from '@/utils/mixin'

export default {
  name: 'TeacherPane',
  mixins: [resize, monthChange],
  components: {
    ScheduleTable
  },
  data () {
    return {
      expendList: [], // 支出列表
      searchForm: { // 搜索表单
        month: getCurrentMonth(),
        teacherId: null
      },
      jsonFields: {
        老师: 'name',
        总课时: 'hours',
        总课时费: 'schedulePrice'
      }
    }
  },
  computed: {
    ...mapState(['teacherList']),
    excelName () {
      return `${this.$formatTime(this.searchForm.month, 'YYYY-MM')} 老师费用.xls`
    }
  },
  created () {
    this.getExpendList()
  },
  methods: {
    // 获取老师支出列表
    async getExpendList () {
      const where = {
        startAt: {
          [Op.between]: [this.searchForm.month, new Date(this.searchForm.month.getFullYear(), this.searchForm.month.getMonth() + 1)]
        }
      }
      if (this.searchForm.teacherId) {
        where.TeacherId = this.searchForm.teacherId
      }
      const schedules = await this.$models.Schedule.findAll({
        where,
        include: [
          {
            model: this.$models.Teacher
          },
          {
            model: this.$models.StudentSchedule,
            include: this.$models.Student
          },
          {
            model: this.$models.Organization
          }
        ],
        order: [
          ['startAt']
        ]
      })
      const obj = {}
      for (const schedule of schedules) {
        if (!Object.prototype.hasOwnProperty.call(obj, schedule.TeacherId)) {
          obj[schedule.TeacherId] = {
            teacherId: schedule.TeacherId,
            name: schedule.Teacher.name,
            hours: 0,
            schedulePrice: 0,
            details: []
          }
        }
        const teacherInfo = obj[schedule.TeacherId]
        teacherInfo.hours += schedule.duration
        teacherInfo.schedulePrice += schedule.duration * schedule.teacherPrice
        teacherInfo.details.push(schedule)
      }
      this.expendList = Object.values(obj)
    },
    // 合计
    getSummaries ({ columns, data }) {
      const sums = []
      columns.forEach((column, index) => {
        if (index === 1) {
          sums[index] = '合计'
          return
        }
        const values = data.map(item => Number(item[column.property]))
        if (!values.every(value => isNaN(value))) {
          sums[index] = values.reduce((prev, curr) => {
            const value = Number(curr)
            if (!isNaN(value)) {
              return prev + curr
            } else {
              return prev
            }
          }, 0)
          if (column.property === 'hours') {
            sums[index] += ' 小时'
          } else if (column.property === 'schedulePrice') {
            sums[index] += ' 元'
          }
        } else {
          sums[index] = ''
        }
      })

      return sums
    },
    // 监听详细排课表的变化
    handleScheduleSubmitted () {
      this.getExpendList()
    }
  }
}
</script>

<style scoped lang="scss" rel="stylesheet/scss">
  .teacher-pane-page {
    height: 100%;
  }
</style>

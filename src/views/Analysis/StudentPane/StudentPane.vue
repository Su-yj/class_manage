<template>
  <div class="student-pane-page">
    <el-form :model="searchForm" ref="searchFormRef" size="mini" inline>
      <el-form-item>
        <el-button-group class="month-button-group">
          <el-button type="primary" icon="el-icon-arrow-left" @click="prevMonth(getIncomeList)" title="上个月"></el-button>
          <el-button type="primary" icon="el-icon-arrow-right" @click="nextMonth(getIncomeList)" title="下个月"></el-button>
        </el-button-group>
      </el-form-item>
      <el-form-item label="月份" prop="month">
        <el-date-picker v-model="searchForm.month" :editable="false" type="month" :clearable="false" style="width: 120px" @change="getIncomeList"></el-date-picker>
      </el-form-item>
      <el-form-item prop="studentId" label="学生">
        <el-select v-model="searchForm.studentId" clearable filterable placeholder="学生" style="width: 120px" @change="getIncomeList">
          <el-option v-for="item in studentList" :key="item.id" :label="item.name" :value="item.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item prop="organizationId" label="机构">
        <el-select v-model="searchForm.organizationId" clearable filterable placeholder="机构" style="width: 120px" @change="getIncomeList">
          <el-option v-for="item in organizationList" :key="item.id" :label="item.name" :value="item.id"></el-option>
        </el-select>
      </el-form-item>
      <download-excel class="export-button" :data="incomeList" :fields="jsonFields" :name="excelName">
        <el-button type="primary" size="mini" icon="el-icon-download">导出数据</el-button>
      </download-excel>
    </el-form>
    <!--学生收入表格-->
    <el-table :data="incomeList" size="medium" style="width: 100%" border stripe show-summary :summary-method="getSummaries" @expand-change="expandChange" :max-height="maxHeight">
      <el-table-column type="expand" align="center">
        <template slot-scope="{row}">
          <ScheduleTable :data="row.details" v-loading="row.details===null" @submitted="handleScheduleSubmitted"/>
        </template>
      </el-table-column>
      <el-table-column label="学生" prop="name" align="center"></el-table-column>
      <el-table-column label="总课时" prop="hours" align="center">
        <template slot-scope="{row}">
          <span>{{row.hours}} 小时</span>
        </template>
      </el-table-column>
      <el-table-column label="总课时费" prop="schedulePrice" align="center">
        <template slot-scope="{row}">
          <span>{{row.schedulePrice}} 元</span>
        </template>
      </el-table-column>
      <el-table-column label="托管费" prop="trusteeshipPrice" align="center">
        <template slot-scope="{row}">
          <span>{{row.trusteeshipPrice}} 元</span>
        </template>
      </el-table-column>
      <el-table-column label="应收总费" prop="totalPrice" align="center">
        <template slot-scope="{row}">
          <span>{{row.schedulePrice + row.trusteeshipPrice}} 元</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { Op } from 'sequelize'
import { getCurrentMonth } from '@/utils'
import { mapState } from 'vuex'
import resize from '@/views/Analysis/mixins/resize'
import ScheduleTable from '@/components/ScheduleTable/ScheduleTable'
import { monthChange } from '@/utils/mixin'

export default {
  name: 'StudentPane',
  mixins: [resize, monthChange],
  components: {
    ScheduleTable
  },
  prop: {
    // 当前激活的tab
    activeName: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      incomeList: [], // 收入列表
      searchForm: {
        month: getCurrentMonth(),
        studentId: null,
        organizationId: null
      },
      jsonFields: {
        学生: 'name',
        总课时: 'hours',
        总课时费: 'schedulePrice',
        托管费: 'trusteeshipPrice',
        应收总费: {
          callback: value => {
            return value.schedulePrice + value.trusteeshipPrice
          }
        }
      }
    }
  },
  computed: {
    ...mapState(['studentList', 'organizationList']),
    excelName () {
      return `${this.$formatTime(this.searchForm.month, 'YYYY-MM')} 学生收费.xls`
    }
  },
  created () {
    this.getIncomeList()
  },
  methods: {
    // 获取学生应收价格列表
    async getIncomeList () {
      // 用于快速记录数据并返回
      const obj = {}
      // 课时费的查询条件
      const scheduleWhere = {
        '$Schedule.startAt$': {
          [Op.between]: [this.searchForm.month, new Date(this.searchForm.month.getFullYear(), this.searchForm.month.getMonth() + 1)]
        }
      }
      if (this.searchForm.studentId) {
        scheduleWhere.StudentId = this.searchForm.studentId
      }
      if (this.searchForm.organizationId) {
        scheduleWhere['$Schedule.OrganizationId$'] = this.searchForm.organizationId
      }
      // 查询学生的课时费
      const studentSchedules = await this.$models.StudentSchedule.findAll({
        where: scheduleWhere,
        include: [
          {
            model: this.$models.Student
          },
          {
            model: this.$models.Schedule,
            include: this.$models.Teacher
          }
        ]
      })
      // 遍历结果计算课时费
      for (const item of studentSchedules) {
        // 如果没有排课信息，则跳过
        if (item.Schedule === null) continue
        // 查看是否已经有该学生的信息，没有则创建
        if (!Object.prototype.hasOwnProperty.call(obj, item.StudentId)) {
          obj[item.StudentId] = {
            studentId: item.StudentId,
            name: item.Student.name,
            hours: 0,
            schedulePrice: 0,
            trusteeshipPrice: 0,
            details: null
          }
        }
        const studentInfo = obj[item.StudentId]
        // 对课时和费用进行添加
        studentInfo.hours += item.Schedule.duration
        studentInfo.schedulePrice += Number((item.Schedule.duration * item.price).toFixed(2))
      }
      const trusteeshipWhere = {
        month: this.$formatTime(this.searchForm.month, 'YYYY-MM')
      }
      if (this.searchForm.studentId) {
        trusteeshipWhere.StudentId = this.searchForm.studentId
      }
      // 当没有选择机构或者选择补习社的时候，才把学生托管费一起统计
      if (!this.searchForm.organizationId || this.searchForm.organizationId === 1) {
        // 查询学生的托管费
        const trusteeshipList = await this.$models.Trusteeship.findAll({
          where: trusteeshipWhere,
          include: this.$models.Student
        })
        // 遍历结果计算课时费
        for (const item of trusteeshipList) {
          if (!Object.prototype.hasOwnProperty.call(obj, item.StudentId)) {
            obj[item.StudentId] = {
              studentId: item.StudentId,
              name: item.Student.name,
              hours: 0,
              schedulePrice: 0,
              trusteeshipPrice: 0,
              details: null
            }
          }
          const studentInfo = obj[item.StudentId]
          studentInfo.trusteeshipPrice = item.price
        }
      }
      this.incomeList = Object.values(obj)
    },
    // 表格行展开
    async expandChange (row, expandedRows) {
      if (row.details !== null) return
      const where = {
        startAt: {
          [Op.between]: [this.searchForm.month, new Date(this.searchForm.month.getFullYear(), this.searchForm.month.getMonth() + 1)]
        },
        '$StudentSchedules.StudentId$': row.studentId
      }
      const { rows } = await this.$store.getters.getScheduleList(where)
      row.details = rows
    },
    // 合计
    getSummaries ({ columns, data }) {
      const sums = []
      let totalPrice = 0
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
          } else if (column.property === 'schedulePrice' || column.property === 'trusteeshipPrice') {
            totalPrice += sums[index]
            sums[index] += ' 元'
          }
        } else {
          sums[index] = ''
        }
      })
      sums[5] = totalPrice + ' 元'

      return sums
    },
    // 监听排课表格修改排课数据
    handleScheduleSubmitted () {
      this.getIncomeList()
    }
  }
}
</script>

<style scoped lang="scss" rel="stylesheet/scss">
  .student-pane-page {
    height: 100%;
  }
</style>

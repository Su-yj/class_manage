<template>
  <div class="subject-pane-page">
    <!--头部搜索表单-->
    <el-form :model="searchForm" ref="searchFormRef" size="mini" inline>
      <el-form-item>
        <el-button-group class="month-button-group">
          <el-button type="primary" icon="el-icon-arrow-left" @click="prevMonth(initData)" title="上个月"></el-button>
          <el-button type="primary" icon="el-icon-arrow-right" @click="nextMonth(initData)" title="下个月"></el-button>
        </el-button-group>
      </el-form-item>
      <el-form-item label="月份" prop="month">
        <el-date-picker v-model="searchForm.month" :editable="false" type="month" :clearable="false" style="width: 120px" @change="initData"></el-date-picker>
      </el-form-item>
      <el-form-item prop="studentId" label="学生">
        <el-select v-model="searchForm.studentId" clearable filterable placeholder="学生" style="width: 120px" @change="initData">
          <el-option v-for="item in studentList" :key="item.id" :label="item.name" :value="item.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item prop="teacherId" label="老师">
        <el-select v-model="searchForm.teacherId" clearable filterable placeholder="老师" style="width: 120px" @change="initData">
          <el-option v-for="item in teacherList" :key="item.id" :label="item.name" :value="item.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item prop="organizationId" label="机构">
        <el-select v-model="searchForm.organizationId" clearable filterable placeholder="机构" style="width: 120px" @change="initData">
          <el-option v-for="item in organizationList" :key="item.id" :label="item.name" :value="item.id"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <!--数据表格-->
    <el-table v-loading="tableLoading" :data="subjectList" size="medium" style="width: 100%" border stripe :max-height="maxHeight" show-summary :summary-method="getSummaries" @expand-change="expandChange">
      <el-table-column type="expand" align="center">
        <template slot-scope="{row}">
          <ScheduleTable :data="row.details" v-loading="row.details===null" @submitted="handleScheduleSubmitted"/>
        </template>
      </el-table-column>
      <el-table-column label="老师" prop="teacherName" align="center" sortable></el-table-column>
      <el-table-column label="学生" prop="studentName" align="center" sortable></el-table-column>
      <el-table-column label="科目" prop="subject" align="center" sortable></el-table-column>
      <el-table-column label="课时" prop="hours" align="center"></el-table-column>
      <el-table-column label="学生价格" prop="studentTotal" align="center"></el-table-column>
      <el-table-column label="老师价格" prop="teacherTotal" align="center"></el-table-column>
    </el-table>
  </div>
</template>

<script>
import { getCurrentMonth } from '@/utils'
import { mapState } from 'vuex'
import resize from '@/views/Analysis/mixins/resize'
import { monthChange } from '@/utils/mixin'
import { Op } from 'sequelize'
import ScheduleTable from '@/components/ScheduleTable/ScheduleTable'

export default {
  name: 'SubjectPane',
  mixins: [resize, monthChange],
  components: {
    ScheduleTable
  },
  props: {
    activeName: String
  },
  data () {
    return {
      studentScheduleList: [], // 排课列表
      subjectList: [], // 科目列表
      tableLoading: false,
      searchForm: {
        month: getCurrentMonth(),
        studentId: null,
        teacherId: null,
        organizationId: null
      }
    }
  },
  computed: {
    ...mapState(['studentList', 'teacherList', 'organizationList'])
  },
  created () {
    this.initData()
  },
  methods: {
    async initData () {
      this.tableLoading = true
      await this.getScheduleList()
      this.parseSubjectList()
      this.tableLoading = false
    },
    async getScheduleList () {
      const where = {
        '$Schedule.startAt$': {
          [Op.between]: [this.searchForm.month, new Date(this.searchForm.month.getFullYear(), this.searchForm.month.getMonth() + 1)]
        }
      }
      if (this.searchForm.studentId) {
        where.StudentId = this.searchForm.studentId
      }
      if (this.searchForm.teacherId) {
        where['$Schedule.TeacherId$'] = this.searchForm.teacherId
      }
      if (this.searchForm.organizationId) {
        where['$Schedule.OrganizationId$'] = this.searchForm.organizationId
      }
      // 查询学生的课时费
      this.studentScheduleList = await this.$models.StudentSchedule.findAll({
        where,
        include: [
          {
            model: this.$models.Student
          },
          {
            model: this.$models.Schedule,
            include: [
              this.$models.Teacher,
              this.$models.Organization
            ]
          }
        ]
      })
    },
    parseSubjectList () {
      this.subjectList = []
      const temp = {}
      this.studentScheduleList.forEach(item => {
        if (!Object.prototype.hasOwnProperty.call(temp, item.Schedule.TeacherId)) {
          temp[item.Schedule.TeacherId] = {
            id: item.Schedule.TeacherId,
            name: item.Schedule.Teacher.name,
            subjectDict: {}
          }
        }
        const teacherDict = temp[item.Schedule.TeacherId]
        const subjectDict = teacherDict.subjectDict
        if (!Object.prototype.hasOwnProperty.call(subjectDict, item.Schedule.name)) {
          subjectDict[item.Schedule.name] = {
            name: item.Schedule.name,
            studentDict: {}
          }
        }
        const studentDict = subjectDict[item.Schedule.name].studentDict
        if (!Object.prototype.hasOwnProperty.call(studentDict, item.StudentId)) {
          studentDict[item.StudentId] = {
            id: item.StudentId,
            name: item.Student.name,
            hours: 0,
            teacherTotal: 0,
            studentTotal: 0
          }
        }
        const studentInfo = studentDict[item.StudentId]
        studentInfo.hours += item.Schedule.duration
        studentInfo.teacherTotal += item.Schedule.duration * item.Schedule.teacherPrice
        studentInfo.studentTotal += item.Schedule.duration * item.price
      })
      for (const [k1, v1] of Object.entries(temp)) {
        // k1: 老师ID, v1: {id: 2, name: '老师名称', subjectDict: {科目字典}}
        for (const [k2, v2] of Object.entries(v1.subjectDict)) {
          // k2: 科目名称, v2: {name: '科目名称', studentDict: {学生字典}}
          for (const [k3, v3] of Object.entries(v2.studentDict)) {
            // k3: 学生id， v3: {hours: 总课时, id: 学生id， name: 学生名称, studentTotal: 学生总费用, teacherTotal: 老师总费用}
            this.subjectList.push({
              teacherId: k1,
              teacherName: v1.name,
              subject: k2,
              hours: v3.hours,
              studentId: k3,
              studentName: v3.name,
              studentTotal: v3.studentTotal,
              teacherTotal: v3.teacherTotal,
              details: null
            })
          }
        }
      }
    },
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
        }
      })
      return sums
    },
    async expandChange (row, expandedRows) {
      if (row.details !== null) return
      const where = {
        startAt: {
          [Op.between]: [this.searchForm.month, new Date(this.searchForm.month.getFullYear(), this.searchForm.month.getMonth() + 1)]
        },
        name: row.subject,
        TeacherId: row.teacherId,
        '$StudentSchedules.StudentId$': row.studentId
      }
      const { rows } = await this.$store.getters.getScheduleList(where)
      row.details = rows
    },
    // 监听排课表格修改排课数据
    handleScheduleSubmitted () {
      this.initData()
    }
  }
}
</script>

<style scoped lang="scss" rel="stylesheet/scss">
  .subject-pane-page {
    height: 100%;
  }
</style>

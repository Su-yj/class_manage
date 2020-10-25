<template>
  <div class="schedule-table">
    <el-table :data="data" :key="tableKey" style="width: 100%" :max-height="maxHeight" size="mini" border stripe show-summary :summary-method="getSummaries">
      <el-table-column prop="Organization.name" label="机构" align="center"></el-table-column>
      <el-table-column prop="name" label="课程" align="center" sortable></el-table-column>
      <el-table-column label="时间" prop="startAt" align="center" min-width="85px" sortable>
        <template slot-scope="scope">
          <p>{{scope.row.startAt | parseTime('MM-DD HH:mm')}}</p>
          <p>{{scope.row.endAt | parseTime('MM-DD HH:mm')}}</p>
        </template>
      </el-table-column>
      <el-table-column label="课时" align="center">
        <template slot-scope="scope">
          <span>{{scope.row.duration}} 小时</span>
        </template>
      </el-table-column>
      <!--<el-table-column label="学生" align="center">-->
      <!--  <template slot-scope="scope">-->
      <!--    <p v-for="(item, index) in scope.row.StudentSchedules" :key="index">{{item.Student.name}}</p>-->
      <!--  </template>-->
      <!--</el-table-column>-->
      <el-table-column label="学生课时费" align="center">
        <template slot="header">
          <span>学生课时费 <el-button type="text" @click="isShowStudentPrice=!isShowStudentPrice" :icon="isShowStudentPrice ? 'el-icon-third-eye1' : 'el-icon-third-eye'"></el-button></span>
        </template>
        <template slot-scope="scope">
          <p v-for="(item, index) in scope.row.StudentSchedules" :key="index">{{item.Student.name}}{{isShowStudentPrice ? `：${item.price}` : ''}}</p>
        </template>
      </el-table-column>
      <el-table-column label="学生小计" align="center">
        <template slot="header">
          <span>学生小计 <el-button type="text" @click="isShowStudentTotal=!isShowStudentTotal" :icon="isShowStudentTotal ? 'el-icon-third-eye1' : 'el-icon-third-eye'"></el-button></span>
        </template>
        <template slot-scope="scope">
          <div v-if="isShowStudentTotal">
            <p v-for="(item, index) in scope.row.StudentSchedules" :key="index">{{item.Student.name}}：{{Number((item.price * scope.row.duration).toFixed(2))}} 元</p>
          </div>
          <span v-else><i class="el-icon-third-eye"></i></span>
        </template>
      </el-table-column>
      <!--<el-table-column prop="Teacher.name" label="老师" align="center"></el-table-column>-->
      <el-table-column prop="TeacherId" label="老师课时费" align="center" v-if="showTeacher" sortable>
        <template slot="header">
          <span>老师课时费 <el-button type="text" @click="isShowTeacherPrice=!isShowTeacherPrice" :icon="isShowTeacherPrice ? 'el-icon-third-eye1' : 'el-icon-third-eye'"></el-button></span>
        </template>
        <template slot-scope="scope">
          {{scope.row.Teacher.name}}{{isShowTeacherPrice ? `：${scope.row.teacherPrice}` : ''}}
        </template>
      </el-table-column>
      <el-table-column prop="teacherPrice" label="老师小计" align="center" v-if="showTeacher">
        <template slot="header">
          <span>老师小计 <el-button type="text" @click="isShowTeacherTotal=!isShowTeacherTotal" :icon="isShowTeacherTotal ? 'el-icon-third-eye1' : 'el-icon-third-eye'"></el-button></span>
        </template>
        <template slot-scope="scope">
          <span v-if="isShowTeacherTotal">{{Number((scope.row.duration * scope.row.teacherPrice).toFixed(2))}} 元</span>
          <span v-else><i class="el-icon-third-eye"></i></span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" min-width="83px">
        <template slot="header">
          <el-button type="text" size="mini" @click="addRow">添加</el-button>
          <download-excel style="display: inline-block; margin-left: 10px" :fetch="getJsonData" :fields="jsonFields" name="排课表.xls">
            <el-button type="text" size="mini">导出</el-button>
          </download-excel>
        </template>
        <template slot-scope="scope">
          <el-button size="mini" type="text" @click="editRow(scope.row)">编辑</el-button>
          <el-popconfirm title="确定删除吗？" style="margin-left: 10px" @onConfirm="deleteSchedule(scope.row)">
            <el-button slot="reference" type="text" size="mini">删除</el-button>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <ScheduleForm :create="!currentRow" :data="currentRow" :visible.sync="visible" @closed="handleDialogClosed" @submitted="handleDialogSubmitted"/>
  </div>
</template>

<script>
import ScheduleForm from '@/components/Forms/ScheduleForm'

export default {
  name: 'ScheduleTable',
  components: {
    ScheduleForm
  },
  props: {
    data: {
      type: Array
    },
    maxHeight: {
      type: Number,
      default: 450
    },
    showTeacher: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      tableKey: 0,
      currentRow: null, // 当前编辑的行
      visible: false, // 对话框开关
      isShowStudentPrice: false, // 是否显示学生的课时费
      isShowStudentTotal: false, // 是否显示学生的课时总费
      isShowTeacherPrice: false, // 是否显示老师的课时费
      isShowTeacherTotal: false, // 是否显示老师的课时总费
      jsonFields: {
        机构: 'Organization.name',
        课程名称: 'name',
        开始时间: {
          field: 'startAt',
          callback: value => {
            return this.$formatTime(value, 'MM月DD日 HH:mm')
          }
        },
        结束时间: {
          field: 'endAt',
          callback: value => {
            return this.$formatTime(value, 'MM月DD日 HH:mm')
          }
        },
        '课时(小时)': 'duration',
        学生: {
          field: 'StudentSchedules',
          callback: value => {
            return value.map(item => item.Student.name).join('\n')
          }
        },
        '学生课时费(元/小时)': {
          field: 'StudentSchedules',
          callback: value => {
            return value.map(item => `${item.Student.name}：${item.price}`).join('\n')
          }
        },
        '学生小计(元)': {
          callback: value => {
            return value.StudentSchedules.map(item => `${item.Student.name}：${Number((item.price * value.duration).toFixed(2))}`).join('\n')
          }
        },
        老师: 'Teacher.name',
        '老师课时费(元/小时)': 'teacherPrice',
        '老师小计(元)': {
          callback: value => {
            return Number((value.duration * value.teacherPrice).toFixed(2))
          }
        }
      }
    }
  },
  methods: {
    getJsonData () {
      return this.data
    },
    getSummaries ({ columns, data }) {
      const sums = ['合计']
      if (data) {
        let duration = 0 // 课时
        let teacherTotal = 0 // 老师课时费
        let studentTotal = 0 // 学生课时费
        data.forEach(item => {
          duration += item.duration
          teacherTotal += item.duration * item.teacherPrice
          studentTotal += item.StudentSchedules.map(studentSchedule => studentSchedule.price * item.duration).reduce((accumulator, currentValue) => accumulator + currentValue)
        })
        sums[3] = duration + ' 小时'
        if (this.isShowStudentTotal) {
          sums[5] = studentTotal + ' 元'
        }
        if (this.showTeacher && this.isShowTeacherTotal) {
          sums[7] = teacherTotal + ' 元'
        }
        const total = studentTotal - teacherTotal
        if (this.isShowStudentTotal && this.isShowTeacherTotal) {
          sums[columns.length - 1] = '利润: ' + total + ' 元'
        }
      }
      return sums
    },
    // 添加排课
    addRow () {
      this.currentRow = null
      this.visible = true
    },
    // 编辑排课
    editRow (row) {
      this.currentRow = row
      this.visible = true
    },
    // 删除排课
    async deleteSchedule (row) {
      const schedule = await this.$models.Schedule.findByPk(row.id)
      if (schedule === null) {
        return this.$message.error('未找到数据')
      }
      await schedule.destroy()
      this.$emit('submitted')
    },
    // 监听表单对话框关闭
    handleDialogClosed () {
      this.currentRow = null
    },
    // 监听表单对话框提交
    handleDialogSubmitted () {
      this.$emit('submitted')
    }
  },
  watch: {
    isShowStudentPrice () {
      this.tableKey++
    },
    isShowStudentTotal () {
      this.tableKey++
    },
    isShowTeacherPrice () {
      this.tableKey++
    },
    isShowTeacherTotal () {
      this.tableKey++
    },
    showTeacher () {
      this.tableKey++
      this.isShowTeacherPrice = false
      this.isShowTeacherTotal = false
    }
  }
}
</script>

<style scoped lang="scss">

</style>

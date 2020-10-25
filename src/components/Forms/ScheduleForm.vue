<template>
  <el-dialog v-dialog-drag :title="title" :visible.sync="dialogVisible" width="400px" @open="handleDialogOpen" @closed="handleDialogClosed">
    <el-form :model="scheduleForm" ref="scheduleFormRef" :rules="scheduleFormRules" size="mini" label-width="90px">
      <el-form-item label="机构" prop="organization">
        <el-select v-model="scheduleForm.organization" style="width: 80%">
          <el-option v-for="item in organizationList" :key="item.id" :value="item.id" :label="item.name"></el-option>
        </el-select>
        <el-button type="success" circle icon="el-icon-plus" size="mini" style="float: right" @click="orgDialogVisible=true"></el-button>
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input v-model="scheduleForm.name" placeholder="课程名称"></el-input>
      </el-form-item>
      <el-form-item label="开始时间" prop="start">
        <el-date-picker v-model="scheduleForm.start" format="yyyy-MM-dd HH:mm" type="datetime" style="width: 100%"></el-date-picker>
      </el-form-item>
      <el-form-item label="结束时间" prop="end">
        <el-date-picker v-model="scheduleForm.end" format="yyyy-MM-dd HH:mm" type="datetime" style="width: 100%;"></el-date-picker>
      </el-form-item>
      <el-form-item label="颜色" prop="color">
        <el-color-picker v-model="scheduleForm.color" :predefine="predefine"></el-color-picker>
      </el-form-item>
      <el-form-item label="老师" prop="teacherId">
        <el-select v-model="scheduleForm.teacherId" filterable style="width: 80%" @change="handleTeacherSelectChange" placeholder="请选择老师">
          <el-option v-for="teacher in teacherList" :key="teacher.id" :label="teacher.name" :value="teacher.id"></el-option>
        </el-select>
        <el-button type="success" circle icon="el-icon-plus" size="mini" style="float: right" @click="teacherDialogVisible=true"></el-button>
      </el-form-item>
      <el-form-item label="老师价格" prop="teacherPrice">
        <el-input v-model.number="scheduleForm.teacherPrice" type="number" placeholder="单位：元/小时"></el-input>
      </el-form-item>
      <el-row v-for="(student, index) in scheduleForm.students" :key="index" type="flex" align="middle">
        <el-col :span="21">
          <el-form-item :label="`学生${index+1}`" :prop="`students.${index}.studentId`" :rules="[{ required: true, message: '请选择学生', trigger: 'change' }]">
            <el-select v-model="student.studentId" filterable style="width: 80%" @change="handleStudentSelectChange($event, student)" placeholder="请选择学生">
              <el-option v-for="item in studentList" :key="item.id" :label="item.name" :value="item.id"></el-option>
            </el-select>
            <el-button type="success" circle icon="el-icon-plus" size="mini" style="float: right" @click="studentDialogVisible=true"></el-button>
          </el-form-item>
          <el-form-item :label="`学生价格${index+1}`" :prop="`students.${index}.studentPrice`" :rules="[{ required: true, message: '请输入价格', trigger: 'blur' }, { type: 'number', message: '价格必须为数值' }]">
            <el-input v-model.number="student.studentPrice" type="number" placeholder="单位：元/小时"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="3" style="text-align: right">
          <el-button v-if="index===0" type="success" circle icon="el-icon-plus" size="mini" style="margin-bottom: 18px" @click="addStudents"></el-button>
          <el-button v-else type="danger" circle icon="el-icon-minus" size="mini" style="margin-bottom: 18px" @click="removeStudents(index)"></el-button>
        </el-col>
      </el-row>
    </el-form>
    <span slot="footer">
      <el-button size="mini" type="warning" @click="cloneNextWeek" :loading="cloneLoading" v-if="$route.name === 'Schedule' && !create">{{cloneLoading ? '复制中...' : '复制到下周'}}</el-button>
      <el-button size="mini" type="primary" @click="submitScheduleForm" :loading="submitLoading">{{submitLoading ? '提交中...' : '确 定'}}</el-button>
      <el-button size="mini" @click="dialogVisible=false">取 消</el-button>
      <el-button size="mini" type="danger" @click="deleteSchedule" :loading="deleteLoading" v-if="!create">{{deleteLoading ? '删除中...' : '删 除'}}</el-button>
    </span>
    <OrganizationForm append-to-body :visible.sync="orgDialogVisible"/>
    <TeacherForm append-to-body create :visible.sync="teacherDialogVisible" @submitted="handleTeacherFormSubmitted"/>
    <StudentForm append-to-body create :visible.sync="studentDialogVisible"/>
  </el-dialog>
</template>

<script>
import OrganizationForm from '@/components/Forms/OrganizationForm'
import TeacherForm from '@/components/Forms/TeacherForm'
import StudentForm from '@/components/Forms/StudentForm'
import { mapState } from 'vuex'
import { formMixin } from '@/utils/mixin'
import { Op } from 'sequelize'

export default {
  name: 'ScheduleForm',
  mixins: [formMixin],
  components: {
    OrganizationForm,
    TeacherForm,
    StudentForm
  },
  props: {
    // 仅用于添加排课时使用
    start: Date,
    end: Date
  },
  data () {
    const validateStart = (rule, value, callback) => {
      if (this.scheduleForm.end) {
        if (value >= this.scheduleForm.end) {
          return callback(new Error('开始时间不能大于结束时间'))
        }
      }
      callback()
    }
    const validateEnd = (rule, value, callback) => {
      if (this.scheduleForm.start) {
        if (value <= this.scheduleForm.start) {
          return callback(new Error('结束时间不能小于开始时间'))
        }
      }
      callback()
    }
    return {
      orgDialogVisible: false,
      teacherDialogVisible: false,
      studentDialogVisible: false,
      deleteLoading: false, // 删除时的加载
      cloneLoading: false, // 复制课程时的加载
      scheduleForm: { // 课表编辑表单
        id: null,
        organization: null,
        start: null,
        end: null,
        name: null,
        color: null,
        teacherId: null,
        teacherPrice: null,
        students: [{
          studentScheduleId: null,
          studentId: null,
          studentPrice: null
        }]
      },
      scheduleFormRules: {
        organization: [
          { required: true, message: '请选择机构', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入课程名称', trigger: 'blur' }
        ],
        start: [
          { required: true, message: '请选择开始时间', trigger: 'blur' },
          { validator: validateStart, trigger: 'blur' }
        ],
        end: [
          { required: true, message: '请选择结束时间', trigger: 'blur' },
          { validator: validateEnd, trigger: 'blur' }
        ],
        color: [
          { required: true, message: '请选择颜色', trigger: 'blur' }
        ],
        teacherId: [
          { required: true, message: '请选择老师', trigger: 'change' }
        ],
        teacherPrice: [
          { required: true, message: '请输入价格', trigger: 'blur' },
          { type: 'number', message: '价格必须为数值' }
        ]
      }
    }
  },
  computed: {
    ...mapState(['teacherList', 'studentList', 'organizationList']),
    predefine () {
      return this.$store.state.config.predefine
    },
    title () {
      if (this.create) {
        return '添加课表'
      }
      return '编辑课表'
    }
  },
  methods: {
    // 复制课程到下周
    async cloneNextWeek () {
      const result = await this.$confirm('确定复制当前课程到下周吗？', '提示', {
        type: 'warning'
      }).then(() => true).catch(() => false)
      if (!result) return
      this.cloneLoading = true
      const startAt = new Date(new Date(this.data.startAt).getTime() + 3600 * 1000 * 24 * 7)
      const endAt = new Date(new Date(this.data.endAt).getTime() + 3600 * 1000 * 24 * 7)
      const schedules = await this.$models.Schedule.findAll({
        where: {
          name: this.data.name,
          TeacherId: this.data.TeacherId,
          startAt,
          endAt,
          '$StudentSchedules.StudentId$': {
            [Op.in]: this.data.StudentSchedules.map(item => item.StudentId)
          }
        },
        include: this.$models.StudentSchedule
      })
      if (schedules.length) {
        const result = await this.$confirm('下周存在相似课程，是否继续复制？', '提示', {
          type: 'warning'
        }).then(() => true).catch(() => false)
        if (!result) {
          this.cloneLoading = false
          return
        }
      }
      const cloneStudentScheduleList = []
      for (const studentSchedule of this.data.StudentSchedules) {
        const cloneStudentSchedule = await this.$models.StudentSchedule.create({
          price: studentSchedule.price,
          StudentId: studentSchedule.StudentId
        })
        cloneStudentScheduleList.push(cloneStudentSchedule)
      }
      const cloneSchedule = await this.$models.Schedule.create({
        OrganizationId: this.data.OrganizationId,
        name: this.data.name,
        teacherPrice: this.data.teacherPrice,
        TeacherId: this.data.TeacherId,
        color: this.data.color,
        startAt,
        endAt
      })
      await cloneSchedule.setStudentSchedules(cloneStudentScheduleList)
      this.$emit('cloned')
      this.cloneLoading = false
      this.dialogVisible = false
    },
    // 提交表单
    async submitScheduleForm () {
      let val
      this.$refs.scheduleFormRef.validate(async valid => {
        val = valid
      })
      if (!val) return
      this.submitLoading = true
      let schedule
      if (this.create) {
        schedule = await this.createSchedule()
      } else {
        schedule = await this.editSchedule()
      }
      if (!schedule) return
      this.$message.success(this.create ? '添加成功' : '修改成功')
      this.$emit('submitted')
      this.submitLoading = false
      this.dialogVisible = false
    },
    // 创建排课
    async createSchedule () {
      const studentSchedules = []
      for (const item of this.scheduleForm.students) {
        const studentSchedule = await this.$models.StudentSchedule.create({
          StudentId: item.studentId,
          price: item.studentPrice
        })
        studentSchedules.push(studentSchedule)
      }
      const schedule = await this.$models.Schedule.create({
        OrganizationId: this.scheduleForm.organization,
        name: this.scheduleForm.name,
        TeacherId: this.scheduleForm.teacherId,
        teacherPrice: this.scheduleForm.teacherPrice,
        color: this.scheduleForm.color,
        startAt: this.scheduleForm.start,
        endAt: this.scheduleForm.end
      })
      await schedule.setStudentSchedules(studentSchedules)
      return schedule
    },
    // 编辑排课
    async editSchedule () {
      const schedule = await this.$models.Schedule.findByPk(this.data.id)
      if (schedule === null) {
        this.$message.error('未找到该数据')
        return
      }
      const studentSchedules = []
      for (const item of this.scheduleForm.students) {
        let studentSchedule
        if (item.studentScheduleId !== null) {
          studentSchedule = await this.$models.StudentSchedule.findByPk(item.studentScheduleId)
          studentSchedule.StudentId = item.studentId
          studentSchedule.price = item.studentPrice
          await studentSchedule.save()
        } else {
          studentSchedule = await this.$models.StudentSchedule.create({
            price: item.studentPrice,
            StudentId: item.studentId
          })
        }
        studentSchedules.push(studentSchedule)
      }
      schedule.OrganizationId = this.scheduleForm.organization
      schedule.name = this.scheduleForm.name
      schedule.color = this.scheduleForm.color
      schedule.teacherPrice = this.scheduleForm.teacherPrice
      schedule.TeacherId = this.scheduleForm.teacherId
      schedule.startAt = this.scheduleForm.start
      schedule.endAt = this.scheduleForm.end
      await schedule.save()
      await schedule.setStudentSchedules(studentSchedules)
      return schedule
    },
    // 删除课程
    async deleteSchedule () {
      this.$confirm('确定删除该课程吗？', '提示', {
        type: 'warning'
      }).then(async () => {
        this.deleteLoading = true
        const schedule = await this.$models.Schedule.findByPk(this.data.id)
        await schedule.destroy()
        this.$emit('deleted', this.data.id)
        this.deleteLoading = false
        this.$message.success('删除成功')
        this.dialogVisible = false
      }).catch(() => {})
    },
    // 添加课程的学生
    addStudents () {
      this.scheduleForm.students.push({ studentScheduleId: null, studentId: null, studentPrice: null })
    },
    // 减少课程学生
    removeStudents (index) {
      this.scheduleForm.students.splice(index, 1)
    },
    // 监听老师选择框改变
    async handleTeacherSelectChange (val) {
      const teacher = await this.$models.Teacher.findByPk(val)
      if (teacher === null) return
      this.scheduleForm.teacherPrice = teacher.price
    },
    // 学生下拉框改变
    async handleStudentSelectChange (val, item) {
      const student = await this.$models.Student.findByPk(val)
      if (student !== null) {
        item.studentPrice = student.price
      }
    },
    // 监听对话框打开
    handleDialogOpen () {
      this.scheduleForm.organization = this.create ? 1 : this.data.OrganizationId
      this.scheduleForm.name = this.create ? null : this.data.name
      this.scheduleForm.start = this.create ? this.start : this.data.startAt
      this.scheduleForm.end = this.create ? this.end : this.data.endAt
      this.scheduleForm.color = this.create ? '#3788D8' : this.data.color
      this.scheduleForm.teacherId = this.create ? null : this.data.TeacherId
      this.scheduleForm.teacherPrice = this.create ? null : this.data.teacherPrice
      const students = []
      if (this.create) {
        students.push({
          studentScheduleId: null,
          studentId: null,
          studentPrice: null
        })
      } else {
        this.data.StudentSchedules.forEach(item => {
          students.push({
            studentScheduleId: item.id,
            studentId: item.StudentId,
            studentPrice: item.price
          })
        })
      }
      this.scheduleForm.students = students
      this.$nextTick(() => {
        this.$refs.scheduleFormRef.clearValidate()
      })
    },
    // 监听老师对话框提交后
    handleTeacherFormSubmitted (teacher) {
      this.scheduleForm.teacherId = teacher.id
      this.scheduleForm.teacherPrice = teacher.price
    }
  }
}
</script>

<style scoped>

</style>

<template>
  <el-dialog v-dialog-drag :title="title" :visible.sync="dialogVisible" width="400px" @open="handleDialogOpen" @closed="handleDialogClosed">
    <el-form :model="courseForm" ref="courseFormRef" :rules="courseFormRules" size="mini" label-width="90px">
      <el-form-item label="机构" prop="organization">
        <el-select v-model="courseForm.organization" style="width: 80%">
          <el-option v-for="item in organizationList" :key="item.id" :value="item.id" :label="item.name"></el-option>
        </el-select>
        <el-button type="success" circle icon="el-icon-plus" size="mini" style="float: right" @click="orgDialogVisible=true"></el-button>
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input v-model="courseForm.name" placeholder="课程名称"></el-input>
      </el-form-item>
      <el-form-item label="颜色" prop="color">
        <el-color-picker v-model="courseForm.color" :predefine="predefine"></el-color-picker>
      </el-form-item>
      <el-form-item label="老师" prop="teacherId">
        <el-select v-model="courseForm.teacherId" filterable @change="teacherSelectChange" style="width: 80%" placeholder="请选择老师">
          <el-option v-for="teacher in teacherList" :key="teacher.id" :label="teacher.name" :value="teacher.id"></el-option>
        </el-select>
        <el-button type="success" circle icon="el-icon-plus" size="mini" style="float: right" @click="teacherDialogVisible=true"></el-button>
      </el-form-item>
      <el-form-item label="老师价格" prop="teacherPrice">
        <el-input v-model.number="courseForm.teacherPrice" type="number" placeholder="单位：元/小时"></el-input>
      </el-form-item>
      <el-row v-for="(student, index) in courseForm.students" :key="index" type="flex" align="middle">
        <el-col :span="21">
          <el-form-item :label="`学生${index+1}`" :prop="`students.${index}.studentId`" :rules="[{ required: true, message: '请选择学生', trigger: 'change' }]">
            <el-select v-model="student.studentId" filterable @change="studentSelectChange($event, student)" style="width: 80%" placeholder="请选择学生">
              <el-option v-for="item in studentList" :key="item.id" :label="item.name" :value="item.id"></el-option>
            </el-select>
            <el-button type="success" circle icon="el-icon-plus" size="mini" style="float: right" @click="studentDialogVisible=true"></el-button>
          </el-form-item>
          <el-form-item :label="`学生价格${index+1}`" :prop="`students.${index}.studentPrice`" :rules="[{ required: true, message: '请输入价格', trigger: 'blur' }, { type: 'number', message: '价格必须为数值' }]">
            <el-input v-model.number="student.studentPrice" type="number" placeholder="单位：元/小时"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="3" style="text-align: right">
          <el-button v-if="index===0" type="success" circle icon="el-icon-plus" size="mini" style="margin-bottom: 18px" @click="addCourseStudents"></el-button>
          <el-button v-else type="danger" circle icon="el-icon-minus" size="mini" style="margin-bottom: 18px" @click="removeCourseStudents(index)"></el-button>
        </el-col>
      </el-row>
    </el-form>
    <span slot="footer">
      <el-button size="mini" type="primary" @click="submitForm" :loading="submitLoading">{{submitLoading ? '提交中...' : '确 定'}}</el-button>
      <el-button size="mini" @click="dialogVisible=false">取 消</el-button>
    </span>
    <OrganizationForm append-to-body :visible.sync="orgDialogVisible"/>
    <StudentForm append-to-body create :visible.sync="studentDialogVisible"/>
    <TeacherForm append-to-body create :visible.sync="teacherDialogVisible" @submitted="handleTeacherFormSubmitted"/>
  </el-dialog>
</template>

<script>
import OrganizationForm from '@/components/Forms/OrganizationForm'
import StudentForm from '@/components/Forms/StudentForm'
import TeacherForm from '@/components/Forms/TeacherForm'
import { mapState } from 'vuex'
import { formMixin } from '@/utils/mixin'
import { Op } from 'sequelize'

export default {
  name: 'CourseForm',
  mixins: [formMixin],
  components: {
    OrganizationForm,
    StudentForm,
    TeacherForm
  },
  data () {
    return {
      orgDialogVisible: false,
      studentDialogVisible: false,
      teacherDialogVisible: false,
      courseForm: { // 添加/编辑课程表单
        organization: 1,
        name: null,
        color: '#3788D8',
        teacherId: null,
        teacherPrice: null,
        students: [{
          studentCourseId: null,
          studentId: null,
          studentPrice: null
        }]
      },
      courseFormRules: { // 课程表单验证规则
        organization: [
          { required: true, message: '请选择机构', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入课程名称', trigger: 'blur' }
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
    ...mapState(['organizationList', 'teacherList', 'studentList']),
    predefine () {
      return this.$store.state.config.predefine
    },
    title () {
      if (this.create) {
        return '添加课程'
      }
      return '编辑课程'
    }
  },
  methods: {
    async submitForm () {
      let val
      this.$refs.courseFormRef.validate(async valid => {
        val = valid
      })
      if (!val) return
      const isContinue = await this.checkSameData()
      if (!isContinue) return
      this.submitLoading = true
      if (!this.create) {
        await this.editCourse()
      } else {
        await this.addCourse()
      }
      this.$emit('submitted')
      this.submitLoading = false
      this.dialogVisible = false
    },
    async checkSameData () {
      const where = {
        isDelete: false,
        name: {
          [Op.like]: `%${this.courseForm.name}%`
        },
        TeacherId: this.courseForm.teacherId,
        '$StudentCourses.StudentId$': {
          [Op.in]: this.courseForm.students.map(item => item.studentId)
        }
      }
      if (!this.create) {
        where.id = {
          [Op.not]: this.data.id
        }
      }
      let isContinue = true
      const { rows } = await this.$store.getters.getCourseList(where)
      if (rows.length) {
        const msg = rows.map(item => {
          const students = item.StudentCourses.map(studentCourse => `${studentCourse.Student.name}(${studentCourse.price}元/小时)`).join('、')
          return `【${item.name} | ${item.Teacher.name}(${item.teacherPrice}元/小时) | ${students}】`
        }).join('，')
        await this.$confirm(this.create ? `已存在相似的课程 ${msg}，是否继续添加` : `已存在相似的课程 ${msg}，是否继续修改`, '提示', {
          type: 'warning'
        }).then(() => {
          isContinue = true
        }).catch(() => {
          isContinue = false
        })
      }
      return isContinue
    },
    // 添加课程
    async addCourse () {
      const studentCourses = []
      for (const item of this.courseForm.students) {
        const studentCourse = await this.$models.StudentCourse.create({
          price: item.studentPrice,
          StudentId: item.studentId
        })
        studentCourses.push(studentCourse)
      }
      const course = await this.$models.Course.create({
        OrganizationId: this.courseForm.organization,
        name: this.courseForm.name,
        color: this.courseForm.color,
        teacherPrice: this.courseForm.teacherPrice,
        TeacherId: this.courseForm.teacherId
      })
      console.log('studentCourses', studentCourses)
      await course.setStudentCourses(studentCourses)
    },
    // 编辑课程
    async editCourse () {
      const course = await this.$models.Course.findByPk(this.data.id)
      if (course === null) return this.$message.error('未找到该数据')
      const studentCourses = []
      for (const item of this.courseForm.students) {
        let studentCourse
        if (item.studentCourseId !== null) {
          studentCourse = await this.$models.StudentCourse.findByPk(item.studentCourseId)
          studentCourse.StudentId = item.studentId
          studentCourse.price = item.studentPrice
          await studentCourse.save()
        } else {
          studentCourse = await this.$models.StudentCourse.create({
            price: item.studentPrice,
            StudentId: item.studentId
          })
        }
        studentCourses.push(studentCourse)
      }
      course.OrganizationId = this.courseForm.organization
      course.name = this.courseForm.name
      course.color = this.courseForm.color
      course.teacherPrice = this.courseForm.teacherPrice
      course.TeacherId = this.courseForm.teacherId
      await course.save()
      await course.setStudentCourses(studentCourses)
    },
    // 老师下拉框改变
    async teacherSelectChange (val) {
      const teacher = await this.$models.Teacher.findByPk(val)
      if (teacher === null) return
      this.courseForm.teacherPrice = teacher.price
    },
    // 学生下拉框改变
    async studentSelectChange (val, item) {
      const student = await this.$models.Student.findByPk(val)
      if (student !== null) {
        item.studentPrice = student.price
      }
    },
    // 添加课程的学生
    addCourseStudents () {
      this.courseForm.students.push({ studentCourseId: null, studentId: null, studentPrice: null })
    },
    // 减少课程学生
    removeCourseStudents (index) {
      this.courseForm.students.splice(index, 1)
    },
    // 添加机构
    async addOrganization () {
      let val
      this.$refs.organizationFormRef.validate(async valid => {
        val = valid
      })
      if (!val) return
      await this.$models.Organization.create({
        name: this.organizationForm.name
      })
      this.getOrganizationList()
      this.$refs.organizationFormRef.resetFields()
    },
    // 监听对话框打开
    handleDialogOpen () {
      const students = []
      if (!this.create) {
        for (const item of this.data.StudentCourses) {
          students.push({
            studentCourseId: item.id,
            studentId: item.StudentId,
            studentPrice: item.price
          })
        }
      } else {
        students.push({
          studentCourseId: null,
          studentId: null,
          studentPrice: null
        })
      }
      this.courseForm.organization = this.create ? 1 : this.data.OrganizationId
      this.courseForm.name = this.create ? null : this.data.name
      this.courseForm.color = this.create ? '#3788D8' : this.data.color
      this.courseForm.teacherId = this.create ? null : this.data.TeacherId
      this.courseForm.teacherPrice = this.create ? null : this.data.teacherPrice
      this.courseForm.students = students
      this.$nextTick(() => {
        this.$refs.courseFormRef.clearValidate()
      })
    },
    // 监听老师对话框提交后
    handleTeacherFormSubmitted (teacher) {
      this.courseForm.teacherId = teacher.id
      this.courseForm.teacherPrice = teacher.price
    }
  }
}
</script>

<style scoped>

</style>

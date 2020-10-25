<template>
  <el-dialog v-dialog-drag :title="title" :visible.sync="dialogVisible" width="300px" @open="handleDialogOpen" @closed="handleDialogClosed" :appendToBody="appendToBody">
    <el-form ref="studentFormRef" :model="studentForm" :rules="studentFormRules" size="mini" label-width="50px">
      <el-form-item label="姓名" prop="name">
        <el-input v-model="studentForm.name"></el-input>
      </el-form-item>
      <el-form-item label="性别" prop="gender">
        <el-radio-group v-model="studentForm.gender">
          <el-radio label="男"></el-radio>
          <el-radio label="女"></el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="价格" prop="price">
        <el-input v-model.number="studentForm.price" type="number" placeholder="默认价格（元/小时）"></el-input>
      </el-form-item>
      <el-form-item label="年级" prop="grade">
        <el-input v-model="studentForm.grade" placeholder="年级"></el-input>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input type="textarea" v-model="studentForm.remark" placeholder=""></el-input>
      </el-form-item>
    </el-form>
    <span slot="footer">
      <el-button type="primary" @click="submitStudentForm" size="mini" :loading="submitLoading">{{submitLoading ? '提交中...' : '确 定'}}</el-button>
      <el-button @click="dialogVisible = false" size="mini">取 消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { formMixin } from '@/utils/mixin'
import { Op } from 'sequelize'

export default {
  name: 'StudentForm',
  mixins: [formMixin],
  data () {
    return {
      studentForm: { // 学生表单数据
        name: null,
        gender: '男',
        price: null,
        grade: null,
        remark: null
      },
      studentFormRules: { // 学生表单规则
        name: [
          { required: true, message: '请输入学生姓名', trigger: 'blur' },
          { max: 20, message: '最多20个字符', trigger: 'blur' }
        ],
        gender: [
          { required: true, message: '请选择性别', trigger: 'change' }
        ],
        price: [
          { required: true, message: '请输入默认价格', trigger: 'blur' },
          { type: 'number', message: '价格必须为数值' }
        ]
      }
    }
  },
  computed: {
    // 对话框标题
    title () {
      if (this.create) {
        return '添加学生'
      }
      return '编辑学生'
    }
  },
  methods: {
    // 提交学生表单数据
    async submitStudentForm () {
      let val
      this.$refs.studentFormRef.validate(async valid => { val = valid })
      if (!val) return
      const isContinue = await this.checkSameData(this.studentForm.name)
      if (!isContinue) return
      this.submitLoading = true
      // 如果有学生ID，则说明是编辑数据
      let student
      if (!this.create) {
        student = await this.$models.Student.findByPk(this.data.id)
        if (student === null) return this.$message.error('未找到数据')
        student.name = this.studentForm.name
        student.gender = this.studentForm.gender
        student.price = this.studentForm.price
        student.grade = this.studentForm.grade
        student.remark = this.studentForm.remark
        await student.save()
        this.$message.success('修改成功')
      } else {
        // 没有ID，则是添加数据
        student = await this.$models.Student.create(this.studentForm)
        this.$message.success('添加成功')
      }
      await this.$store.dispatch('updateStudentList')
      this.$emit('submitted', student)
      this.submitLoading = false
      this.dialogVisible = false
    },
    // 检查是否有相同类似的数据
    async checkSameData (name) {
      const students = await this.$models.Student.findAll({
        where: {
          name: { [Op.like]: `%${name}%` },
          isDelete: false
        }
      })
      let result = true
      if (this.create && students.length) {
        const studentNames = students.map(item => item.name).join('，')
        await this.$confirm(`已存在相似学生（${studentNames}），是否继续添加?`, '提示', {
          type: 'warning'
        }).then(() => {
          result = true
        }).catch(() => {
          result = false
        })
      } else if (!this.create && students.length && name !== this.data.name) {
        const studentNames = students.map(item => item.name).join('，')
        await this.$confirm(`已存在相似学生（${studentNames}），是否继续修改?`, '提示', {
          type: 'warning'
        }).then(() => {
          result = true
        }).catch(() => {
          result = false
        })
      }
      return result
    },
    // 监听对话框打开
    handleDialogOpen () {
      this.studentForm.name = this.data ? this.data.name : null
      this.studentForm.gender = this.data ? this.data.gender : '男'
      this.studentForm.price = this.data ? this.data.price : null
      this.studentForm.grade = this.data ? this.data.grade : null
      this.studentForm.remark = this.data ? this.data.remark : null
      this.$nextTick(() => {
        this.$refs.studentFormRef.clearValidate()
      })
    }
  }
}
</script>

<style scoped>

</style>

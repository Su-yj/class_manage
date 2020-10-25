<template>
  <el-dialog v-dialog-drag :title="title" width="400px" :visible.sync="dialogVisible" @open="handleDialogOpen" @closed="handleDialogClosed">
    <el-form ref="trusteeshipFormRef" :model="trusteeshipForm" :rules="trusteeshipFormRules" size="mini" label-width="60px">
      <el-form-item label="学生" prop="studentId">
        <el-select v-model="trusteeshipForm.studentId" :disabled="!create" filterable style="width: 80%">
          <el-option v-for="item in studentList" :key="item.id" :label="item.name" :value="item.id"></el-option>
        </el-select>
        <el-button type="success" size="mini" circle icon="el-icon-plus" style="float: right" @click="studentDialogVisible=true"></el-button>
      </el-form-item>
      <el-form-item label="价格" prop="price">
        <el-input v-model.number="trusteeshipForm.price" type="number" placeholder="单位：元"></el-input>
      </el-form-item>
      <el-form-item prop="month" label="时间">
        <el-date-picker v-model="trusteeshipForm.month" :disabled="!create" :editable="false" type="month" :clearable="false" style="width: 100%"></el-date-picker>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="trusteeshipForm.remark" type="textarea"></el-input>
      </el-form-item>
    </el-form>
    <span slot="footer">
      <el-button type="primary" size="mini" @click="submitForm" :loading="submitLoading">{{submitLoading ? '提交中...' : '确 定'}}</el-button>
      <el-button size="mini" @click="dialogVisible=false">取 消</el-button>
    </span>
    <StudentForm create :visible.sync="studentDialogVisible" appendToBody @submitted="handleStudentFormSubmitted"/>
  </el-dialog>
</template>

<script>
import { formMixin } from '@/utils/mixin'
import { mapState } from 'vuex'
import { getCurrentMonth } from '@/utils'
import StudentForm from '@/components/Forms/StudentForm'

export default {
  name: 'TrusteeshipForm',
  mixins: [formMixin],
  components: {
    StudentForm
  },
  props: {
    month: {
      type: Date,
      default: getCurrentMonth()
    }
  },
  data () {
    return {
      studentDialogVisible: false, // 添加学生对话框开关
      trusteeshipForm: { // 托管表单
        studentId: null,
        price: null,
        month: null,
        remark: null
      },
      trusteeshipFormRules: {
        studentId: [
          { required: true, message: '请选择学生', trigger: 'change' }
        ],
        price: [
          { required: true, message: '请输入价格', trigger: 'blur' },
          { type: 'number', message: '价格必须为数值' }
        ],
        month: [
          { required: true, message: '请选择月份', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    ...mapState(['studentList']),
    title () {
      if (this.create) {
        return '添加托管'
      }
      return '编辑托管'
    }
  },
  methods: {
    async submitForm () {
      let val
      this.$refs.trusteeshipFormRef.validate(async valid => {
        val = valid
      })
      if (!val) return
      this.submitLoading = true
      const month = this.$formatTime(this.trusteeshipForm.month, 'YYYY-MM')
      if (this.create) {
        const exist = await this.$models.Trusteeship.findOne({
          where: {
            StudentId: this.trusteeshipForm.studentId,
            month
          }
        })
        if (exist !== null) {
          const student = await this.$models.Student.findByPk(this.trusteeshipForm.studentId)
          this.submitLoading = false
          return this.$message.error(`${student.name}在${month}已有托管`)
        }
        await this.$models.Trusteeship.create({
          StudentId: this.trusteeshipForm.studentId,
          price: this.trusteeshipForm.price,
          remark: this.trusteeshipForm.remark,
          month
        })
        this.$message.success('添加成功')
      } else {
        const trusteeship = await this.$models.Trusteeship.findByPk(this.data.id)
        if (trusteeship === null) return this.$message.error('未找到数据')
        trusteeship.price = this.trusteeshipForm.price
        trusteeship.StudentId = this.trusteeshipForm.studentId
        trusteeship.remark = this.trusteeshipForm.remark
        trusteeship.month = this.$formatTime(this.trusteeshipForm.month, 'YYYY-MM')
        await trusteeship.save()
        this.$message.success('修改成功')
      }
      this.$emit('submitted')
      this.submitLoading = false
      this.dialogVisible = false
    },
    handleDialogOpen () {
      this.trusteeshipForm.studentId = this.create ? null : this.data.StudentId
      this.trusteeshipForm.price = this.create ? null : this.data.price
      this.trusteeshipForm.remark = this.create ? null : this.data.remark
      if (this.create) {
        this.trusteeshipForm.month = this.month || getCurrentMonth()
      } else {
        this.trusteeshipForm.month = this.data.month
      }
      this.$nextTick(() => {
        this.$refs.trusteeshipFormRef.clearValidate()
      })
    },
    handleStudentFormSubmitted (student) {
      this.trusteeshipForm.studentId = student.id
    }
  }
}
</script>

<style scoped>

</style>

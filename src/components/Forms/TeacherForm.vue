<template>
  <el-dialog v-dialog-drag :title="title" :visible.sync="dialogVisible" width="300px" :appendToBody="appendToBody" @open="handleDialogOpen" @closed="handleDialogClosed">
    <el-form ref="teacherFormRef" :rules="teacherFormRules" :model="teacherForm" size="mini" label-width="50px">
      <el-form-item label="姓名" prop="name">
        <el-input v-model="teacherForm.name" placeholder="请输入姓名"></el-input>
      </el-form-item>
      <el-form-item label="性别" prop="gender">
        <el-radio-group v-model="teacherForm.gender">
          <el-radio label="男"></el-radio>
          <el-radio label="女"></el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="价格" prop="price">
        <el-input v-model.number="teacherForm.price" type="number" placeholder="默认价格（元/小时）"></el-input>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input type="textarea" v-model="teacherForm.remark" placeholder=""></el-input>
      </el-form-item>
    </el-form>
    <span slot="footer">
      <el-button type="primary" @click="submitForm" size="mini" :loading="submitLoading">{{submitLoading ? '提交中...' : '确 定'}}</el-button>
      <el-button @click="dialogVisible = false" size="mini">取 消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { formMixin } from '@/utils/mixin'
import { Op } from 'sequelize'

export default {
  name: 'TeacherForm',
  mixins: [formMixin],
  data () {
    return {
      teacherForm: {
        name: null,
        gender: '女',
        price: null,
        remark: null
      },
      teacherFormRules: {
        name: [
          { required: true, message: '请输入姓名', trigger: 'blur' },
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
    title () {
      if (this.create) {
        return '添加老师'
      }
      return '编辑老师'
    }
  },
  methods: {
    async submitForm () {
      let val
      this.$refs.teacherFormRef.validate(async valid => {
        val = valid
      })
      if (!val) return
      const isContinue = await this.checkSameData(this.teacherForm.name)
      if (!isContinue) return
      this.submitLoading = true
      let teacher
      if (this.create) {
        teacher = await this.$models.Teacher.create(this.teacherForm)
      } else {
        teacher = await this.$models.Teacher.findByPk(this.data.id)
        if (teacher === null) {
          return this.$message.error('未找到数据')
        }
        teacher.name = this.teacherForm.name
        teacher.gender = this.teacherForm.gender
        teacher.price = this.teacherForm.price
        teacher.remark = this.teacherForm.remark
        await teacher.save()
      }
      this.$message.success(this.create ? '添加成功' : '修改成功')
      await this.$store.dispatch('updateTeacherList')
      this.$emit('submitted', teacher)
      this.submitLoading = false
      this.dialogVisible = false
    },
    async checkSameData (name) {
      const teachers = await this.$models.Teacher.findAll({
        where: {
          name: { [Op.like]: `%${name}%` },
          isDelete: false
        }
      })
      let result = true
      if (teachers.length && this.create) {
        const teacherNames = teachers.map(item => item.name).join('，')
        await this.$confirm(`已存在相似老师（${teacherNames}），是否继续添加?`, '提示', {
          type: 'warning'
        }).then(() => {
          result = true
        }).catch(() => {
          result = false
        })
      } else if (!this.create && teachers.length && name !== this.data.name) {
        const teacherNames = teachers.map(item => item.name).join('，')
        await this.$confirm(`已存在相似老师（${teacherNames}），是否继续修改?`, '提示', {
          type: 'warning'
        }).then(() => {
          result = true
        }).catch(() => {
          result = false
        })
      }
      return result
    },
    handleDialogOpen () {
      this.teacherForm.name = this.data ? this.data.name : null
      this.teacherForm.gender = this.data ? this.data.gender : '女'
      this.teacherForm.price = this.data ? this.data.price : null
      this.teacherForm.remark = this.data ? this.data.remark : null
      this.$nextTick(() => {
        this.$refs.teacherFormRef.clearValidate()
      })
    }
  }
}
</script>

<style scoped>

</style>

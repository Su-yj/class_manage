<template>
  <el-dialog v-dialog-drag :title="title" :visible.sync="dialogVisible" :append-to-body="appendToBody" width="400px" @open="handleDialogOpen" @closed="handleDialogClosed">
    <el-form :model="othersForm" :rules="othersFormRules" ref="othersFormRef" size="mini" label-width="60px">
      <el-form-item label="时间" prop="month">
        <el-date-picker v-model="othersForm.month" :editable="false" type="month" :clearable="false" style="width: 100%"></el-date-picker>
      </el-form-item>
      <el-form-item label="类型" prop="cat">
        <el-radio-group v-model="othersForm.cat">
          <el-radio label="收入"></el-radio>
          <el-radio label="支出"></el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="金额" prop="price">
        <el-input v-model.number="othersForm.price" type="number" style="width: 100%" placeholder="单位：元"></el-input>
      </el-form-item>
      <el-form-item label="说明" prop="remark">
        <el-input v-model="othersForm.remark" style="width: 100%"></el-input>
      </el-form-item>
    </el-form>
    <span slot="footer">
      <el-button size="mini" type="primary" :loading="submitLoading" @click="submitForm">{{submitLoading ? '提交中...' : '确 定'}}</el-button>
      <el-button size="mini" @click="dialogVisible=false">取 消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { formMixin } from '@/utils/mixin'
import { getCurrentMonth } from '@/utils'

export default {
  name: 'OthersForm',
  mixins: [formMixin],
  props: {
    month: {
      type: Date,
      default: getCurrentMonth()
    }
  },
  data () {
    return {
      othersForm: { // 表单数据
        cat: '收入',
        price: null,
        remark: null,
        month: getCurrentMonth()
      },
      othersFormRules: {
        cat: [
          { required: true, message: '请选择类型', trigger: 'change' }
        ],
        price: [
          { required: true, message: '请输入金额', trigger: 'blur' },
          { type: 'number', message: '金额必须为数值', trigger: 'blur' }
        ],
        remark: [
          { required: true, message: '请填写说明', trigger: 'blur' }
        ],
        month: [
          { required: true, message: '请选择月份', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    title () {
      if (this.create) {
        return '添加'
      }
      return '编辑'
    }
  },
  methods: {
    // 提交表单
    async submitForm () {
      let val
      this.$refs.othersFormRef.validate(async valid => {
        val = valid
      })
      if (!val) return
      this.submitLoading = true
      const month = this.$formatTime(this.othersForm.month, 'YYYY-MM')
      if (this.create) {
        await this.$models.Others.create({
          cat: this.othersForm.cat,
          price: this.othersForm.price,
          remark: this.othersForm.remark,
          month
        })
        this.$message.success('添加成功')
      } else {
        const others = await this.$models.Others.findByPk(this.data.id)
        if (others === null) {
          this.submitLoading = false
          this.$message.error('未找到该数据')
          return
        }
        others.cat = this.othersForm.cat
        others.price = this.othersForm.price
        others.remark = this.othersForm.remark
        others.month = month
        await others.save()
        this.$message.success('修改成功')
      }
      this.$emit('submitted')
      this.submitLoading = false
      this.dialogVisible = false
    },
    // 监听对话框打开
    handleDialogOpen () {
      this.othersForm.cat = this.create ? '收入' : this.data.cat
      this.othersForm.price = this.create ? null : this.data.price
      this.othersForm.remark = this.create ? null : this.data.remark
      if (this.create) {
        this.othersForm.month = this.month || getCurrentMonth()
      } else {
        this.othersForm.month = new Date(this.data.month)
      }
      this.$nextTick(() => {
        this.$refs.othersFormRef.clearValidate()
      })
    }
  }
}
</script>

<style scoped>

</style>

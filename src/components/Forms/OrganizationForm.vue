<template>
  <el-dialog v-dialog-drag title="机构管理" :visible.sync="dialogVisible" width="500px" :append-to-body="appendToBody" @closed="handleDialogClosed">
    <el-form ref="organizationFormRef" size="mini" :model="organizationForm" :rules="organizationFormRules" label-width="80px">
      <el-form-item label="机构名称" prop="name">
        <el-row>
          <el-col :span="16">
            <el-input v-model="organizationForm.name"></el-input>
          </el-col>
          <el-col :span="8" style="text-align: right">
            <el-button type="primary" @click="addOrganization" :loading="addBtnLoading">{{addBtnLoading ? '提交中...' : '添 加'}}</el-button>
          </el-col>
        </el-row>
      </el-form-item>
    </el-form>
    <el-divider></el-divider>
    <el-table :data="organizationManageList" border stripe size="mini" style="width: 100%">
      <el-table-column label="机构名称" prop="name" align="center">
        <template slot-scope="{row}">
          <span v-if="!row.editable">{{row.name}}</span>
          <el-input v-else v-model="row.name" size="mini"></el-input>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" min-width="180px">
        <template slot-scope="{row, $index}">
          <div v-if="row.editable">
            <el-button type="primary" size="mini" @click="editOrganization(row)" :loading="row.btnLoading">{{row.btnLoading ? '提交中...' : '确定'}}</el-button>
            <el-button size="mini" @click="cancelEdit(row)">取消</el-button>
          </div>
          <div v-else>
            <el-button size="mini" type="warning" @click="row.editable=true" >编辑</el-button>
            <el-popconfirm title="确定删除该机构吗？" @onConfirm="deleteOrganization(row, $index)" style="margin-left: 10px">
              <el-button slot="reference" size="mini" type="danger" :loading="row.btnLoading">{{row.btnLoading ? '删除中...' : '删除'}}</el-button>
            </el-popconfirm>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'OrganizationForm',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    appendToBody: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      addBtnLoading: false, // 添加的按钮加载
      dialogVisible: false, // 对话框开关
      organizationManageList: [], // 机构管理列表数据
      organizationForm: { // 添加机构表单数据
        name: ''
      },
      organizationFormRules: { // 验证添加机构表单规则
        name: [
          { required: true, message: '请填写机构名称', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    ...mapState(['organizationList'])
  },
  created () {
    this.getOrganizationManageList()
  },
  methods: {
    // 获取机构管理的列表
    getOrganizationManageList () {
      const organizationList = this.$toJson(this.organizationList)
      for (const organization of organizationList) {
        organization.nameCopy = organization.name
        organization.btnLoading = false
        organization.editable = false
        const temp = this.organizationManageList.find(item => item.id === organization.id)
        if (!temp) {
          this.organizationManageList.push(organization)
        }
      }
    },
    // 添加机构
    async addOrganization () {
      let val
      this.$refs.organizationFormRef.validate(async valid => {
        val = valid
      })
      if (!val) return
      this.addBtnLoading = true
      await this.$models.Organization.create({
        name: this.organizationForm.name
      })
      await this.$store.dispatch('updateOrganizationList')
      this.$refs.organizationFormRef.resetFields()
      this.getOrganizationManageList()
      this.addBtnLoading = false
    },
    // 修改机构管理列表
    async editOrganization (row) {
      row.btnLoading = true
      const organization = await this.$models.Organization.findByPk(row.id)
      if (organization === null) {
        row.btnLoading = false
        return this.$message.error('未找到数据')
      }
      organization.name = row.name
      await organization.save()
      await this.$store.dispatch('updateOrganizationList')
      row.nameCopy = row.name
      row.editable = false
      row.btnLoading = false
    },
    // 删除机构
    async deleteOrganization (row, $index) {
      row.btnLoading = true
      const organization = await this.$models.Organization.findByPk(row.id)
      if (organization === null) {
        row.btnLoading = false
        return this.$message.error('未找到数据')
      }
      organization.isDelete = true
      await organization.save()
      await this.$store.dispatch('updateOrganizationList')
      this.organizationManageList.splice($index, 1)
      row.btnLoading = false
    },
    // 取消编辑
    cancelEdit (row) {
      row.name = row.nameCopy
      row.editable = false
    },
    // 监听对话框关闭
    handleDialogClosed () {
      this.$refs.organizationFormRef.resetFields()
      this.$emit('update:visible', false)
      this.$emit('closed')
    }
  },
  watch: {
    visible (value) {
      this.dialogVisible = value
    }
  }
}
</script>

<style scoped>

</style>

<template>
  <div class="student-page">
    <el-form :model="searchForm" inline size="mini" ref="searchFormRef">
      <el-form-item prop="name" label="姓名">
        <el-input v-model="searchForm.name" @input="searchFormChange" clearable style="width: 130px"></el-input>
      </el-form-item>
    </el-form>
    <!--学生数据表格-->
    <el-table v-loading="tableLoading" :data="studentList" size="medium" border stripe style="width: 100%" :key="tableKey" :max-height="maxHeight">
      <el-table-column prop="name" label="姓名" align="center"></el-table-column>
      <el-table-column prop="gender" label="性别" align="center"></el-table-column>
      <el-table-column prop="grade" label="年级" align="center"></el-table-column>
      <el-table-column prop="price" label="默认价格" align="center">
        <template slot="header">
          <span>默认价格 <el-button type="text" @click="showPrice" :icon="isShowPrice ? 'el-icon-third-eye1' : 'el-icon-third-eye'"></el-button></span>
        </template>
        <template slot-scope="{row}">
          <span v-if="isShowPrice">{{row.price}} 元/小时</span>
          <span v-else><i class="el-icon-third-eye"></i></span>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" align="center"></el-table-column>
      <el-table-column label="是否显示" align="center">
        <template slot-scope="{row}">
          <el-switch v-model="row.isShow" active-color="#13ce66" @change="changeShow(row)"></el-switch>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" min-width="150px">
        <template slot="header">
          <el-button type="primary" size="mini" @click="openStudentFormDialog(null)">添加</el-button>
        </template>
        <template slot-scope="scope">
          <div>
            <el-button type="warning" size="mini" @click="openStudentFormDialog(scope.row)">编辑</el-button>
            <el-popconfirm title="确定删除吗？" @onConfirm="deleteRow(scope.row)" style="margin-left: 10px">
              <el-button slot="reference" type="danger" size="mini">删除</el-button>
            </el-popconfirm>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <!--分页-->
    <el-pagination
      ref="paginationRef"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="searchForm.page"
      :page-sizes="[10, 20, 30, 50]"
      :page-size="searchForm.limit"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      background>
    </el-pagination>
    <!--学生表单对话框-->
    <StudentForm :create="!currentRow" :visible.sync="visible" :data="currentRow" @submitted="handleDialogSubmitted" @closed="handleDialogClosed"/>
  </div>
</template>

<script>
import StudentForm from '@/components/Forms/StudentForm'
import { Op } from 'sequelize'
import { maxHeightReset } from '@/utils/mixin'

export default {
  name: 'Student',
  mixins: [maxHeightReset],
  components: {
    StudentForm
  },
  data () {
    return {
      tableKey: 0,
      tableLoading: false, // 表格加载
      isShowPrice: false, // 是否显示价格
      visible: false, // 学生表单对话框开关
      studentList: [], // 学生列表
      total: 0, // 总数量
      currentRow: null, // 当前的行
      searchForm: { // 搜索表单数据
        page: 1,
        limit: 20,
        name: null
      }
    }
  },
  created () {
    this.getStudentList()
  },
  methods: {
    searchFormChange () {
      this.searchForm.page = 1
      this.getStudentList()
    },
    // 显示价格
    showPrice () {
      this.tableKey++
      this.isShowPrice = !this.isShowPrice
    },
    // 获取学生数据列表
    async getStudentList () {
      this.tableLoading = true
      const offset = (this.searchForm.page - 1) * this.searchForm.limit
      const where = { isDelete: false }
      if (this.searchForm.name) where.name = { [Op.like]: `%${this.searchForm.name}%` }
      const { count, rows } = await this.$models.Student.findAndCountAll({
        where,
        offset,
        limit: this.searchForm.limit
      })
      this.total = count
      this.studentList = this.$toJson(rows)
      this.tableLoading = false
    },
    // 删除数据
    async deleteRow (row) {
      const student = await this.$models.Student.findByPk(row.id)
      if (student === null) return this.$message.error('未找到数据')
      // await student.destroy()
      student.isDelete = true
      await student.save()
      this.$message.success('删除成功')
      this.getStudentList()
      await this.$store.dispatch('updateStudentList')
    },
    // 显示学生表单对话框
    openStudentFormDialog (row) {
      this.currentRow = row
      this.visible = true
    },
    // 修改是否显示
    async changeShow (row) {
      const student = await this.$models.Student.findByPk(row.id)
      if (student === null) return this.$message.error('未找到数据')
      student.isShow = row.isShow
      await student.save()
      await this.$store.dispatch('updateStudentList')
    },
    // 表单提交成功后
    handleDialogSubmitted () {
      this.getStudentList()
    },
    // 监听对话框关闭
    handleDialogClosed () {
      this.currentRow = null
    },
    // 监听limit改变
    handleSizeChange (limit) {
      this.searchForm.limit = limit
      this.getStudentList()
    },
    // 监听页数改变
    handleCurrentChange (page) {
      this.searchForm.page = page
      this.getStudentList()
    }
  }
}
</script>

<style scoped lang="scss" rel="stylesheet/scss">
  .student-page {
    height: 100%;
  }
</style>

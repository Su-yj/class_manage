<template>
  <div class="teacher-page">
    <!--头部搜索表单-->
    <el-form :model="searchForm" inline size="mini" ref="searchFormRef">
      <el-form-item label="姓名" prop="name">
        <el-input v-model="searchForm.name" @input="searchFormChange" clearable style="width: 130px"></el-input>
      </el-form-item>
    </el-form>
    <!--老师表格数据-->
    <el-table v-loading="tableLoading" :data="teacherList" size="medium" border stripe style="width: 100%" :key="tableKey" :max-height="maxHeight">
      <el-table-column prop="name" label="姓名" align="center"></el-table-column>
      <el-table-column prop="gender" label="性别" align="center"></el-table-column>
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
          <el-button type="primary" size="mini" @click="openEditFormDialog(null)">添加</el-button>
        </template>
        <template slot-scope="scope">
          <el-button type="warning" size="mini" @click="openEditFormDialog(scope.row)">编辑</el-button>
          <el-popconfirm title="确定删除吗？" @onConfirm="deleteRow(scope.row)" style="margin-left: 10px">
            <el-button slot="reference" type="danger" size="mini">删除</el-button>
          </el-popconfirm>
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
    <!--添加/编辑老师对话框-->
    <TeacherForm :create="!currentRow" :visible.sync="visible" :data="currentRow" @submitted="handleDialogSubmitted" @closed="handleDialogClosed"/>
  </div>
</template>

<script>
import TeacherForm from '@/components/Forms/TeacherForm'
import { Op } from 'sequelize'
import { maxHeightReset } from '@/utils/mixin'

export default {
  name: 'Teacher',
  mixins: [maxHeightReset],
  components: {
    TeacherForm
  },
  data () {
    return {
      tableKey: 0,
      tableLoading: false,
      teacherList: [],
      isShowPrice: false,
      visible: false,
      total: 0,
      currentRow: null, // 当前编辑的行
      searchForm: {
        page: 1,
        limit: 20,
        name: null
      }
    }
  },
  created () {
    this.getTeacherList()
  },
  methods: {
    searchFormChange () {
      this.searchForm.page = 1
      this.getTeacherList()
    },
    // 显示价格
    showPrice () {
      this.tableKey++
      this.isShowPrice = !this.isShowPrice
    },
    // 获取老师列表
    async getTeacherList () {
      this.tableLoading = true
      const offset = this.searchForm.limit * (this.searchForm.page - 1)
      const where = { isDelete: false }
      if (this.searchForm.name) {
        where.name = { [Op.like]: `%${this.searchForm.name}%` }
      }
      const { count, rows } = await this.$models.Teacher.findAndCountAll({
        where,
        offset,
        limit: this.searchForm.limit
      })
      this.total = count
      this.teacherList = this.$toJson(rows)
      this.tableLoading = false
      console.log(this.teacherList)
    },
    // 修改是否显示
    async changeShow (row) {
      const teacher = await this.$models.Teacher.findByPk(row.id)
      if (teacher === null) return this.$message.error('未找到数据')
      teacher.isShow = row.isShow
      await teacher.save()
      await this.$store.dispatch('updateTeacherList')
    },
    // 打开编辑老师表单
    openEditFormDialog (row) {
      this.currentRow = row
      this.visible = true
    },
    // 删除数据
    async deleteRow (row) {
      const teacher = await this.$models.Teacher.findByPk(row.id)
      if (teacher === null) return this.$message.error('未找到数据')
      // await teacher.destroy()
      teacher.isDelete = true
      await teacher.save()
      this.$message.success('删除成功')
      this.getTeacherList()
      await this.$store.dispatch('updateTeacherList')
    },
    // 监听添加对话框关闭
    handleDialogClosed () {
      this.currentRow = null
    },
    // 监听对话框提交后
    handleDialogSubmitted () {
      this.getTeacherList()
    },
    // 监听limit改变
    handleSizeChange (limit) {
      this.searchForm.limit = limit
      this.getTeacherList()
    },
    // 监听页数改变
    handleCurrentChange (page) {
      this.searchForm.page = page
      this.getTeacherList()
    }
  }
}
</script>

<style scoped rel="stylesheet/scss" lang="scss">
  .teacher-page {
    height: 100%;
  }
</style>

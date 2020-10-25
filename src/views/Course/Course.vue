<template>
  <div class="course-page">
    <!--条件搜索表单-->
    <el-form inline :model="searchForm" ref="searchFormRef" size="mini">
      <el-form-item label="机构" prop="teacher">
        <el-select v-model="searchForm.organization" filterable @change="searchFormChange" placeholder="" clearable style="width: 130px">
          <el-option v-for="item in organizationList" :key="item.id" :label="item.name" :value="item.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="老师" prop="teacher">
        <el-select v-model="searchForm.teacherId" filterable @change="searchFormChange" placeholder="" clearable style="width: 130px">
          <el-option v-for="teacher in teacherList" :key="teacher.id" :label="teacher.name" :value="teacher.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="学生" prop="student">
        <el-select v-model="searchForm.studentId" filterable @change="searchFormChange" placeholder="" clearable style="width: 130px">
          <el-option v-for="student in studentList" :key="student.id" :label="student.name" :value="student.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input v-model="searchForm.name" @input="searchFormChange" placeholder="" clearable style="width: 130px"></el-input>
      </el-form-item>
    </el-form>
    <!--课程表格-->
    <el-table v-loading="tableLoading" :data="courseList" size="medium" border stripe style="width: 100%" :key="tableKey" :max-height="maxHeight">
      <el-table-column prop="name" label="名称" align="center"></el-table-column>
      <el-table-column prop="Organization.name" label="机构" align="center"></el-table-column>
      <el-table-column prop="color" label="颜色" align="center">
        <template slot-scope="{row}">
          <el-color-picker v-model="row.color" size="medium" :predefine="predefine" @change="rowColorChange(row)"></el-color-picker>
        </template>
      </el-table-column>
      <el-table-column prop="Teacher.name" label="老师" align="center"></el-table-column>
      <el-table-column prop="teacherPrice" label="老师价格" align="center">
        <template slot="header">
          <span>老师价格 <el-button type="text" @click="showTeacherPrice" :icon="isShowTeacherPrice ? 'el-icon-third-eye1' : 'el-icon-third-eye'"></el-button></span>
        </template>
        <template slot-scope="{row}">
          <span v-if="isShowTeacherPrice">{{row.teacherPrice}}</span>
          <span v-else><i class="el-icon-third-eye"></i></span>
        </template>
      </el-table-column>
      <el-table-column label="学生" align="center">
        <template slot-scope="{row}">
          <p v-for="(item, index) in row.StudentCourses" :key="index">{{item.Student.name}}</p>
        </template>
      </el-table-column>
      <el-table-column label="学生价格" align="center">
        <template slot="header">
          <span>学生价格 <el-button type="text" @click="showStudentPrice" :icon="isShowStudentPrice ? 'el-icon-third-eye1' : 'el-icon-third-eye'"></el-button></span>
        </template>
        <template slot-scope="{row}">
          <div v-if="isShowStudentPrice">
            <p v-for="(item, index) in row.StudentCourses" :key="index">{{item.Student.name}} : {{item.price}}</p>
          </div>
          <span v-else><i class="el-icon-third-eye"></i></span>
        </template>
      </el-table-column>
      <el-table-column prop="isShow" label="是否显示" align="center">
        <template slot-scope="{row}">
          <el-switch v-model="row.isShow" active-color="#13ce66" @change="changeShow(row)"></el-switch>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" min-width="150px">
        <template slot="header">
          <el-button type="primary" size="mini" @click="visible=true">添加</el-button>
        </template>
        <template slot-scope="{row}">
          <el-button type="warning" size="mini" @click="openCourseDialog(row)">编辑</el-button>
          <el-popconfirm title="确定删除吗？" style="margin-left: 10px" @onConfirm="deleteRow(row)">
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
    <!--添加/编辑 课程对话框-->
    <CourseForm :create="!currentRow" :data="currentRow" :visible.sync="visible" @submitted="handleDialogSubmitted" @closed="handleDialogClosed"/>
  </div>
</template>

<script>
import CourseForm from '@/components/Forms/CourseForm'
import { Op } from 'sequelize'
import { maxHeightReset } from '@/utils/mixin'
import { mapState } from 'vuex'

export default {
  name: 'Course',
  mixins: [maxHeightReset],
  components: {
    CourseForm
  },
  data () {
    return {
      tableLoading: false, // 表格加载
      tableKey: 0,
      courseList: [], // 课程列表数据
      total: 0, // 总数量
      visible: false, // 课程编辑/添加对话框开关
      isShowTeacherPrice: false, // 显示老师价格
      isShowStudentPrice: false, // 显示学生价格
      currentRow: null, // 当前的行数据
      searchForm: { // 搜索表单
        page: 1,
        limit: 20,
        organization: null,
        teacherId: null,
        studentId: null,
        name: null
      }
    }
  },
  computed: {
    ...mapState(['teacherList', 'studentList', 'organizationList']),
    predefine () {
      return this.$store.state.config.predefine
    }
  },
  created () {
    this.getCourseList()
  },
  methods: {
    // 搜索表单改变
    searchFormChange () {
      this.searchForm.page = 1
      this.getCourseList()
    },
    // 获取课程列表数据
    async getCourseList () {
      this.tableLoading = true
      const where = { isDelete: false }
      if (this.searchForm.organization) {
        where.OrganizationId = this.searchForm.organization
      }
      if (this.searchForm.name) {
        where.name = { [Op.like]: `%${this.searchForm.name}%` }
      }
      if (this.searchForm.teacherId) {
        where.TeacherId = this.searchForm.teacherId
      }
      if (this.searchForm.studentId) {
        where['$StudentCourses.StudentId$'] = this.searchForm.studentId
      }
      const { count, rows } = await this.$store.getters.getCourseList(where, this.searchForm.page, this.searchForm.limit)
      this.total = count
      this.courseList = rows
      this.tableLoading = false
    },
    // 打开课程编辑对话框
    openCourseDialog (row) {
      this.currentRow = row
      this.visible = true
    },
    // 显示老师价格
    showTeacherPrice () {
      this.isShowTeacherPrice = !this.isShowTeacherPrice
      this.tableKey++
    },
    // 显示学生价格
    showStudentPrice () {
      this.isShowStudentPrice = !this.isShowStudentPrice
      this.tableKey++
    },
    // 删除课程
    async deleteRow (row) {
      const course = await this.$models.Course.findByPk(row.id)
      if (course === null) return this.$message.error('未找到数据')
      await course.destroy()
      this.$message.success('删除成功')
      this.getCourseList()
      await this.$store.dispatch('updateCourseList')
    },
    // 切换显示
    async changeShow (row) {
      const course = await this.$models.Course.findByPk(row.id)
      if (course === null) return this.$message.error('未找到数据')
      course.isShow = row.isShow
      await course.save()
      // await this.$store.dispatch('updateCourseList')
    },
    // 切换颜色
    async rowColorChange (row) {
      const course = await this.$models.Course.findByPk(row.id)
      if (course === null) return this.$message.error('未找到数据')
      course.color = row.color || '#3788D8'
      row.color = course.color
      await course.save()
    },
    // 监听对话框提交
    handleDialogSubmitted () {
      this.getCourseList()
    },
    // 监听对话框关闭
    handleDialogClosed () {
      this.currentRow = null
    },
    // 监听limit改变
    handleSizeChange (limit) {
      this.searchForm.limit = limit
      this.getCourseList()
    },
    // 监听页数改变
    handleCurrentChange (page) {
      this.searchForm.page = page
      this.getCourseList()
    }
  }
}
</script>

<style scoped lang="scss" rel="stylesheet/scss">
  .course-page {
    height: 100%;
  }
</style>

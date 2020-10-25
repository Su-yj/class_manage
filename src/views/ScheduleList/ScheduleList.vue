<template>
  <div class="schedule-list-page">
    <!--头部搜索表单-->
    <el-form :model="searchForm" ref="searchFormRef" inline size="mini">
      <el-form-item>
        <el-button-group class="month-button-group">
          <el-button type="primary" icon="el-icon-arrow-left" @click="prevMonth(getScheduleList)" title="上个月"></el-button>
          <el-button type="primary" icon="el-icon-arrow-right" @click="nextMonth(getScheduleList)" title="下个月"></el-button>
        </el-button-group>
      </el-form-item>
      <el-form-item prop="month" label="时间">
        <el-date-picker v-model="searchForm.month" :editable="false" type="month" clearable @change="getScheduleList" style="width: 120px"></el-date-picker>
      </el-form-item>
      <el-form-item prop="studentId" label="学生">
        <el-select v-model="searchForm.studentId" clearable filterable placeholder="学生" style="width: 120px" @change="getScheduleList">
          <el-option v-for="item in studentList" :key="item.id" :label="item.name" :value="item.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item prop="teacherId" label="老师">
        <el-select v-model="searchForm.teacherId" clearable filterable placeholder="老师" style="width: 120px" @change="getScheduleList">
          <el-option v-for="item in teacherList" :key="item.id" :label="item.name" :value="item.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item prop="organizationId" label="机构">
        <el-select v-model="searchForm.organizationId" clearable filterable placeholder="机构" style="width: 120px" @change="getScheduleList">
          <el-option v-for="item in organizationList" :key="item.id" :label="item.name" :value="item.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item prop="name" label="课程">
        <el-input v-model="searchForm.name" clearable style="width: 120px" @input="getScheduleList"></el-input>
      </el-form-item>
      <el-switch v-model="isShowTeacher" active-color="#13ce66" style="float: right"></el-switch>
    </el-form>
    <!--排课数据表格-->
    <ScheduleTable :data="scheduleList" :maxHeight="maxHeight" @submitted="handleSubmitted" :showTeacher="isShowTeacher"/>
  </div>
</template>

<script>
import { getCurrentMonth } from '@/utils'
import { mapState } from 'vuex'
import { maxHeightReset, monthChange } from '@/utils/mixin'
import ScheduleTable from '@/components/ScheduleTable/ScheduleTable'
import { Op } from 'sequelize'

export default {
  name: 'ScheduleList',
  mixins: [maxHeightReset, monthChange],
  components: {
    ScheduleTable
  },
  data () {
    return {
      scheduleList: [],
      isShowTeacher: false,
      searchForm: {
        month: getCurrentMonth(),
        studentId: null,
        teacherId: null,
        organizationId: null,
        name: null
      }
    }
  },
  computed: {
    ...mapState(['studentList', 'organizationList', 'teacherList'])
  },
  created () {
    this.getScheduleList()
  },
  methods: {
    async getScheduleList () {
      const where = {}
      if (this.searchForm.organizationId) {
        where.OrganizationId = this.searchForm.organizationId
      }
      if (this.searchForm.studentId) {
        where['$StudentSchedules.StudentId$'] = this.searchForm.studentId
      }
      if (this.searchForm.teacherId) {
        where.TeacherId = this.searchForm.teacherId
      }
      if (this.searchForm.name) {
        where.name = { [Op.like]: `%${this.searchForm.name}%` }
      }
      if (this.searchForm.month) {
        where.startAt = {
          [Op.between]: [this.searchForm.month, new Date(this.searchForm.month.getFullYear(), this.searchForm.month.getMonth() + 1)]
        }
      }
      const { rows } = await this.$store.getters.getScheduleList(where)
      this.scheduleList = rows
    },
    handleSubmitted () {
      this.getScheduleList()
    }
  }
}
</script>

<style scoped lang="scss">
  .schedule-list-page {
    height: 100%;
  }
</style>

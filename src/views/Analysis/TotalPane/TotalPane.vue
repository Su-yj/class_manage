<template>
  <div class="total-pane-page">
    <el-form size="mini" :model="searchForm" inline>
      <el-form-item>
        <el-button-group class="month-button-group">
          <el-button type="primary" icon="el-icon-arrow-left" @click="prevMonth(getTotal)" title="上个月"></el-button>
          <el-button type="primary" icon="el-icon-arrow-right" @click="nextMonth(getTotal)" title="下个月"></el-button>
        </el-button-group>
      </el-form-item>
      <el-form-item label="月份" prop="month">
        <el-date-picker v-model="searchForm.month" :editable="false" type="month" :clearable="false" style="width: 120px" @change="getTotal"></el-date-picker>
      </el-form-item>
      <el-form-item label="机构" prop="organizationId">
        <el-select v-model="searchForm.organizationId" clearable filterable style="width: 120px" @change="getTotal">
          <el-option v-for="item in organizationList" :key="item.id" :value="item.id" :label="item.name"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <el-form inline v-loading="loading" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="课时费利润：">
            <span>{{scheduleTotal}} 元</span>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="课时费收入：">
            <span>{{scheduleIncome}} 元</span>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="课时费支出：">
            <span>{{scheduleExpend}} 元</span>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20" v-if="!this.searchForm.organizationId || this.searchForm.organizationId === 1">
        <el-col :span="8">
          <el-form-item label="其他费利润：">
            <span>{{othersTotal}} 元</span>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="其他费收入：">
            <span>{{othersIncome}} 元</span>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="其他费支出：">
            <span>{{othersExpend}} 元</span>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20" v-if="!this.searchForm.organizationId || this.searchForm.organizationId === 1">
        <el-col :span="8" :offset="8">
          <el-form-item label="晚辅收入：">
            <span>{{trusteeshipTotal}} 元</span>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="总利润：">
            <span>{{total}} 元</span>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="总收入：">
            <span>{{incomeTotal}} 元</span>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="总支出：">
            <span>{{expendTotal}} 元</span>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { getCurrentMonth } from '@/utils'
import { Op } from 'sequelize'
import sequelize from '@/db/sequelize'
import { monthChange } from '@/utils/mixin'

export default {
  name: 'TotalPane',
  mixins: [monthChange],
  data () {
    return {
      trusteeshipTotal: 0, // 晚辅总收益
      scheduleIncome: 0, // 课时费收入
      scheduleExpend: 0, // 课时费支出
      scheduleTotal: 0, // 课时费总收益
      othersIncome: 0, // 其他费用收益
      othersExpend: 0, // 其他费用支出
      othersTotal: 0, // 其他费用总收益
      incomeTotal: 0, // 总收入
      expendTotal: 0, // 总支出
      total: 0, // 总利润
      loading: false,
      scheduleList: [], // 排课列表
      searchForm: {
        month: getCurrentMonth(),
        organizationId: null
      }
    }
  },
  computed: {
    ...mapState(['organizationList'])
  },
  created () {
    this.getTotal()
  },
  async mounted () {
    window.vue = this
  },
  methods: {
    async getTotal () {
      this.loading = true
      await Promise.all([this.getScheduleList(), this.getTrusteeshipTotal(), this.getOthersTotal()])
      this.parseSchedulePrice()
      this.parseTotal()
      this.loading = false
    },
    // 获取排课列表
    async getScheduleList () {
      const start = this.searchForm.month
      const end = new Date(start.getFullYear(), start.getMonth() + 1)
      const where = {
        startAt: {
          [Op.between]: [start, end]
        }
      }
      if (this.searchForm.organizationId) {
        where.OrganizationId = this.searchForm.organizationId
      }
      const { rows } = await this.$store.getters.getScheduleList(where)
      this.scheduleList = rows
    },
    // 获取晚辅总收益
    async getTrusteeshipTotal () {
      const where = {
        month: this.$formatTime(this.searchForm.month, 'YYYY-MM')
      }
      this.trusteeshipTotal = await this.$models.Trusteeship.sum('price', {
        where
      })
    },
    // 获取其他收入支出
    async getOthersTotal () {
      this.othersIncome = 0
      this.othersExpend = 0
      const where = {
        month: this.$formatTime(this.searchForm.month, 'YYYY-MM')
      }
      const result = await this.$models.Others.findAll({
        where,
        attributes: [
          'cat',
          [sequelize.fn('SUM', sequelize.col('price')), 'sum']
        ],
        group: 'cat',
        raw: true
      })
      result.forEach(item => {
        if (item.cat === '收入') {
          this.othersIncome = item.sum
        } else if (item.cat === '支出') {
          this.othersExpend = item.sum
        }
      })
    },
    // 计算课时费的收入支出
    parseSchedulePrice () {
      this.scheduleIncome = 0
      this.scheduleExpend = 0
      this.scheduleList.forEach(item => {
        this.scheduleExpend += item.duration * item.teacherPrice
        item.StudentSchedules.forEach(studentSchedule => {
          this.scheduleIncome += item.duration * studentSchedule.price
        })
      })
    },
    // 计算总收益
    parseTotal () {
      this.scheduleTotal = this.scheduleIncome - this.scheduleExpend
      if (!this.searchForm.organizationId || this.searchForm.organizationId === 1) {
        this.othersTotal = this.othersIncome - this.othersExpend
        this.incomeTotal = this.scheduleIncome + this.othersIncome + this.trusteeshipTotal
        this.expendTotal = this.scheduleExpend + this.othersExpend
        this.total = this.trusteeshipTotal + this.scheduleTotal + this.othersTotal
      } else {
        this.othersTotal = 0
        this.incomeTotal = this.scheduleIncome
        this.expendTotal = this.scheduleExpend
        this.total = this.incomeTotal - this.expendTotal
      }
    }
  }
}
</script>

<style scoped lang="scss" rel="stylesheet/scss">
  .total-pane-page {
    height: 100%;
  }
</style>

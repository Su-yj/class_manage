<template>
  <div class="trusteeship-page">
    <!--头部筛选表单-->
    <el-form ref="searchFormRef" :model="searchForm" inline size="mini">
      <el-form-item>
        <el-button-group class="month-button-group">
          <el-button type="primary" icon="el-icon-arrow-left" @click="prevMonth(searchFormChange)" title="上个月"></el-button>
          <el-button type="primary" icon="el-icon-arrow-right" @click="nextMonth(searchFormChange)" title="下个月"></el-button>
        </el-button-group>
      </el-form-item>
      <el-form-item prop="month" label="时间">
        <el-date-picker v-model="searchForm.month" :editable="false" type="month" clearable @change="searchFormChange" style="width: 120px"></el-date-picker>
      </el-form-item>
      <el-form-item prop="studentId" label="学生">
        <el-select v-model="searchForm.studentId" clearable placeholder="学生" style="width: 120px" @change="searchFormChange">
          <el-option v-for="item in studentList" :key="item.id" :label="item.name" :value="item.id"></el-option>
        </el-select>
      </el-form-item>
      <download-excel class="export-button" :data="trusteeshipList" :fields="jsonFields" :name="excelName">
        <el-button type="primary" size="mini" icon="el-icon-download">导出数据</el-button>
      </download-excel>
    </el-form>
    <!--托管数据表格-->
    <el-table v-loading="tableLoading" :data="trusteeshipList" style="width: 100%" size="mini" border stripe :key="tableKey" :max-height="maxHeight" @sort-change="sortChange" show-summary :summary-method="getSummaries">
      <el-table-column label="学生" prop="Student.name" align="center"></el-table-column>
      <el-table-column label="时间" prop="month" align="center" sortable="custom"></el-table-column>
      <el-table-column label="价格" prop="price" align="center">
        <template slot="header">
          <span>价格 <el-button type="text" @click="showPrice" :icon="isShowPrice ? 'el-icon-third-eye1' : 'el-icon-third-eye'"></el-button></span>
        </template>
        <template slot-scope="{row}">
          <span v-if="isShowPrice">{{row.price}} 元</span>
          <span v-else><i class="el-icon-third-eye"></i></span>
        </template>
      </el-table-column>
      <el-table-column label="备注" prop="remark" align="center"></el-table-column>
      <el-table-column label="操作" align="center" min-width="260px">
        <template slot="header">
          <el-button size="mini" type="success" @click="openDialog(null)">添 加</el-button>
        </template>
        <template slot-scope="{row}">
          <el-button type="info" size="mini" @click="copyToNextMonth(row)">复制到下月</el-button>
          <el-button type="warning" size="mini" @click="openDialog(row)">编辑</el-button>
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
    <!--添加 / 编辑 托管对话框-->
    <TrusteeshipForm :create="!currentRow" :visible.sync="visible" :data="currentRow" :month="searchForm.month" @submitted="handleDialogSubmitted" @closed="handleDialogClosed"/>
  </div>
</template>

<script>
import TrusteeshipForm from '@/components/Forms/TrusteeshipForm'
import { maxHeightReset, monthChange } from '@/utils/mixin'
import { getCurrentMonth, getNextMonth } from '@/utils'
import { mapState } from 'vuex'

export default {
  name: 'Trusteeship',
  mixins: [maxHeightReset, monthChange],
  components: {
    TrusteeshipForm
  },
  data () {
    return {
      tableKey: 0,
      tableLoading: false,
      isShowPrice: false, // 是否显示价格
      visible: false, // 托管对话框开关
      trusteeshipList: [], // 托管数据列表
      total: 0, // 总数量
      currentRow: null, // 当前的行数据
      searchForm: { // 筛选表单
        limit: 20,
        page: 1,
        month: getCurrentMonth(),
        studentId: null,
        order: [['month', 'DESC']]
      },
      jsonFields: {
        学生: 'Student.name',
        时间: {
          field: 'month',
          callback: value => {
            const month = new Date(value)
            return this.$formatTime(month, 'YYYY年MM月')
          }
        },
        价格: 'price',
        备注: 'center'
      }
    }
  },
  computed: {
    ...mapState(['studentList']),
    excelName () {
      if (this.searchForm.month) {
        return `${this.$formatTime(this.searchForm.month, 'YYYY-MM')} 托管费用.xls`
      }
      return '托管费用.xls'
    }
  },
  created () {
    this.getTrusteeshipList()
  },
  methods: {
    searchFormChange () {
      this.searchForm.page = 1
      this.getTrusteeshipList()
    },
    // 获取托管数据
    async getTrusteeshipList () {
      this.tableLoading = true
      const offset = this.searchForm.limit * (this.searchForm.page - 1)
      const where = {}
      if (this.searchForm.month) {
        where.month = this.$formatTime(this.searchForm.month, 'YYYY-MM')
      }
      if (this.searchForm.studentId) {
        where.StudentId = this.searchForm.studentId
      }
      const { rows, count } = await this.$models.Trusteeship.findAndCountAll({
        where,
        offset,
        limit: this.searchForm.limit,
        include: this.$models.Student,
        order: this.searchForm.order
      })
      this.trusteeshipList = this.$toJson(rows)
      this.total = count
      this.tableLoading = false
      console.log('trusteeshipList', this.trusteeshipList)
    },
    // 排序
    sortChange ({ column, prop, order }) {
      console.log(column, prop, order)
      // descending
      if (order === 'descending' || order === null) {
        this.searchForm.order = [['month', 'DESC']]
      } else {
        this.searchForm.order = [['month']]
      }
      this.getTrusteeshipList()
    },
    // 编辑行
    openDialog (row) {
      this.currentRow = row
      this.visible = true
    },
    // 删除托管
    async deleteRow (row) {
      const trusteeship = await this.$models.Trusteeship.findByPk(row.id)
      if (trusteeship === null) return this.$message.error('未找到数据')
      await trusteeship.destroy()
      this.$message.success('删除成功')
      this.getTrusteeshipList()
    },
    // 下个月是否有托管
    async isNextMonthHaveTrusteeship (row) {
      const nextMonth = getNextMonth(row.month)
      return await this.$models.Trusteeship.findOne({
        where: {
          month: nextMonth,
          StudentId: row.StudentId
        }
      })
    },
    // 复制到下个月
    async copyToNextMonth (row) {
      const nextMonth = getNextMonth(row.month)
      const trusteeship = await this.isNextMonthHaveTrusteeship(row)
      if (trusteeship) {
        return this.$message.error(`${row.Student.name}在${nextMonth}已有托管`)
      }
      await this.$models.Trusteeship.create({
        price: row.price,
        remark: row.remark,
        month: nextMonth,
        StudentId: row.StudentId
      })
      this.getTrusteeshipList()
      this.$message.success('添加成功')
    },
    // 合计价格
    getSummaries ({ columns, data }) {
      const sums = ['合计']
      if (this.isShowPrice) {
        let sum = 0
        data.forEach(item => {
          sum += item.price
        })
        sums[2] = sum + ' 元'
      }
      return sums
    },
    // 显示价格
    showPrice () {
      this.tableKey++
      this.isShowPrice = !this.isShowPrice
    },
    // 监听limit改变
    handleSizeChange (limit) {
      this.searchForm.limit = limit
      this.getTrusteeshipList()
    },
    // 监听页数改变
    handleCurrentChange (page) {
      this.searchForm.page = page
      this.getTrusteeshipList()
    },
    // 监听对话框提交
    handleDialogSubmitted () {
      this.getTrusteeshipList()
    },
    // 监听对话框关闭
    handleDialogClosed () {
      this.currentRow = null
    }
  }
}
</script>

<style scoped lang="scss" rel="stylesheet/scss">
  .trusteeship-page {
    height: 100%;
  }
</style>

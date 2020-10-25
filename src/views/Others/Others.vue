<template>
  <div class="others-page">
    <!--头部搜索表单-->
    <el-form ref="searchFormRef" :model="searchForm" size="mini" inline>
      <el-form-item>
        <el-button-group class="month-button-group">
          <el-button type="primary" icon="el-icon-arrow-left" @click="prevMonth(searchFormChange)" title="上个月"></el-button>
          <el-button type="primary" icon="el-icon-arrow-right" @click="nextMonth(searchFormChange)" title="下个月"></el-button>
        </el-button-group>
      </el-form-item>
      <el-form-item prop="month" label="时间">
        <el-date-picker v-model="searchForm.month" :editable="false" type="month" clearable @change="searchFormChange" style="width: 120px"></el-date-picker>
      </el-form-item>
      <el-form-item prop="cat" label="类别">
        <el-select v-model="searchForm.cat" clearable @change="searchFormChange" style="width: 120px">
          <el-option label="收入" value="收入"></el-option>
          <el-option label="支出" value="支出"></el-option>
        </el-select>
      </el-form-item>
      <download-excel class="export-button" :data="othersList" :fields="jsonFields" :name="excelName">
        <el-button type="primary" size="mini" icon="el-icon-download">导出数据</el-button>
      </download-excel>
    </el-form>
    <!--其他收入支出表格-->
    <el-table v-loading="tableLoading" :data="othersList" :key="tableKey" size="mini" :max-height="maxHeight" border stripe show-summary :summary-method="getSummaries">
      <el-table-column label="时间" prop="month" align="center"></el-table-column>
      <el-table-column label="类型" prop="cat" align="center"></el-table-column>
      <el-table-column label="说明" prop="remark" align="center"></el-table-column>
      <el-table-column label="金额" prop="price" align="center">
        <template slot="header">
          <span>价格 <el-button type="text" @click="showPrice" :icon="isShowPrice ? 'el-icon-third-eye1' : 'el-icon-third-eye'"></el-button></span>
        </template>
        <template slot-scope="{row}">
          <span v-if="isShowPrice">{{row.price}} 元</span>
          <span v-else><i class="el-icon-third-eye"></i></span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" min-width="150px">
        <template slot="header">
          <el-button size="mini" type="success" @click="openDialog(null)">添 加</el-button>
        </template>
        <template slot-scope="{row}">
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
    <!--其他收入支出表单对话框-->
    <OthersForm :create="!currentRow" :visible.sync="visible" :data="currentRow" :month="searchForm.month" @submitted="handleDialogSubmitted" @closed="handleDialogClosed"/>
    <!--<iframe id="iframe" src="https://up.woozooo.com/account.php" sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-pointer-lock" style="width: 400px; height: 400px"></iframe>-->
  </div>
</template>

<script>
import OthersForm from '@/components/Forms/OthersForm'
import { maxHeightReset, monthChange } from '@/utils/mixin'
import { getCurrentMonth } from '@/utils'

export default {
  name: 'Others',
  mixins: [maxHeightReset, monthChange],
  components: {
    OthersForm
  },
  data () {
    return {
      tableKey: 0,
      isShowPrice: false,
      tableLoading: false,
      visible: false,
      othersList: [], // 其他收入
      total: 0,
      currentRow: null,
      searchForm: {
        limit: 20,
        page: 1,
        month: getCurrentMonth(),
        cat: null,
        order: [['month', 'DESC']]
      },
      jsonFields: {
        时间: {
          field: 'month',
          callback: value => {
            const month = new Date(value)
            return this.$formatTime(month, 'YYYY年MM月')
          }
        },
        类型: 'cat',
        金额: 'price'
      }
    }
  },
  created () {
    this.getOthersList()
  },
  computed: {
    excelName () {
      if (this.searchForm.month) {
        return `${this.$formatTime(this.searchForm.month, 'YYYY-MM')} 其他费用.xls`
      }
      return '其他费用.xls'
    }
  },
  methods: {
    searchFormChange () {
      this.searchForm.page = 1
      this.getOthersList()
    },
    // 显示价格
    showPrice () {
      this.tableKey++
      this.isShowPrice = !this.isShowPrice
    },
    // 获取其他收入支出
    async getOthersList () {
      this.tableLoading = true
      const where = {}
      if (this.searchForm.month) {
        where.month = this.$formatTime(this.searchForm.month, 'YYYY-MM')
      }
      if (this.searchForm.cat) {
        where.cat = this.searchForm.cat
      }
      const { rows, count } = await this.$models.Others.findAndCountAll({
        where,
        limit: this.searchForm.limit,
        offset: (this.searchForm.page - 1) * this.searchForm.limit,
        order: [
          ['month', 'DESC']
        ]
      })
      this.total = count
      this.othersList = this.$toJson(rows)
      this.tableLoading = false
    },
    // 删除行
    async deleteRow (row) {
      const others = await this.$models.Others.findByPk(row.id)
      if (others === null) {
        this.$message.error('未找到该数据')
      } else {
        await others.destroy()
        this.$message.success('删除成功')
      }
      this.getOthersList()
    },
    // 合计
    getSummaries ({ columns, data }) {
      const sums = ['合计']
      if (this.isShowPrice) {
        let income = 0
        let expend = 0
        data.forEach(item => {
          if (item.cat === '收入') {
            income += item.price
          } else {
            expend += item.price
          }
        })
        sums[1] = '收入：' + income + ' 元'
        sums[2] = '支出：' + expend + ' 元'
        sums[3] = '利润：' + (income - expend) + ' 元'
      }
      return sums
    },
    // 打开添加/编辑对话框
    openDialog (row) {
      this.currentRow = row
      this.visible = true
    },
    // 监听表格提交
    handleDialogSubmitted () {
      this.getOthersList()
    },
    // 监听对话框关闭
    handleDialogClosed () {
      this.currentRow = null
    },
    // 监听limit改变
    handleSizeChange (limit) {
      this.searchForm.limit = limit
      this.getOthersList()
    },
    // 监听页数改变
    handleCurrentChange (page) {
      this.searchForm.page = page
      this.getOthersList()
    }
  }
}
</script>

<style scoped lang="scss" rel="stylesheet/scss">
  .others-page {
    height: 100%;
  }
</style>

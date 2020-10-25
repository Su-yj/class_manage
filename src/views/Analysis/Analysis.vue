<template>
  <div class="analysis-page">
    <el-tabs tab-position="left" class="my-tabs" :active-name="activeName">
      <el-tab-pane label="学生" name="student">
        <StudentPane :activeName="activeName"/>
      </el-tab-pane>
      <el-tab-pane label="老师" name="teacher" lazy>
        <TeacherPane :activeName="activeName"/>
      </el-tab-pane>
      <el-tab-pane label="科目" name="subject" lazy>
        <SubjectPane :activeName="activeName"/>
      </el-tab-pane>
      <el-tab-pane label="合计" name="total" lazy>
        <TotalPane :activeName="activeName"/>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import StudentPane from '@/views/Analysis/StudentPane/StudentPane'
import TeacherPane from '@/views/Analysis/TeacherPane/TeacherPane'
import SubjectPane from '@/views/Analysis/SubjectPane/SubjectPane'
import TotalPane from '@/views/Analysis/TotalPane/TotalPane'

export default {
  name: 'Analysis',
  components: {
    StudentPane,
    TeacherPane,
    SubjectPane,
    TotalPane
  },
  data () {
    return {
      activeName: 'student'
    }
  },
  methods: {
  }
}
</script>

<style scoped lang="scss" rel="stylesheet/scss">
  .analysis-page {
    height: 100%;
    .my-tabs {
      height: 100%;
      ::v-deep .el-tabs__content {
        height: 100%;
      }
      ::v-deep .el-tab-pane {
        height: 100%;
      }
    }
  }
</style>

import path from 'path'

export default {
  isMax: false, // 是否最大化
  baseDir: process.cwd(),
  configFilePath: path.join(process.cwd(), 'config.json'), // 配置文件路径
  backupDir: path.join(process.cwd(), 'backup'), // 备份路径
  isBackup: false,
  config: {}, // 配置
  studentList: [], // 学生列表
  teacherList: [], // 老师列表
  courseList: [], // 课程列表
  organizationList: [] // 机构列表
}

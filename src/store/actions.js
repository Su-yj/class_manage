import models from '@/db/models'
import fs from 'fs'
import path from 'path'
import moment from 'moment'
import { clone, copyFile } from '@/utils'
import {
  UPDATE_STUDENT_LIST,
  UPDATE_TEACHER_LIST,
  UPDATE_COURSE_LIST,
  UPDATE_ORGANIZATION_LIST,
  LOAD_CONFIG,
  UPDATE_IS_BACKUP,
  UPDATE_IS_MAX
} from '@/store/mutation-types'

export default {
  async updateStudentList ({ commit }) {
    const students = await models.Student.findAll({
      where: {
        isDelete: false,
        isShow: true
      }
    })
    const studentList = clone(students)
    commit(UPDATE_STUDENT_LIST, { studentList })
  },
  async updateTeacherList ({ commit }) {
    const teachers = await models.Teacher.findAll({
      where: {
        isDelete: false,
        isShow: true
      }
    })
    const teacherList = clone(teachers)
    commit(UPDATE_TEACHER_LIST, { teacherList })
  },
  async updateCourseList ({ commit }) {
    const courses = await models.Course.findAll({
      where: {
        isDelete: false,
        isShow: true
      },
      include: [
        {
          model: models.Teacher
        },
        {
          model: models.StudentCourse,
          include: models.Student
        }
      ]
    })
    const courseList = clone(courses)
    commit(UPDATE_COURSE_LIST, { courseList })
  },
  async updateOrganizationList ({ commit }) {
    const organizations = await models.Organization.findAll({
      where: {
        isShow: true,
        isDelete: false
      }
    })
    const organizationList = clone(organizations)
    commit(UPDATE_ORGANIZATION_LIST, { organizationList })
  },
  loadConfig ({ commit, state }) {
    fs.readFile(state.configFilePath, 'utf8', (err, data) => {
      let config
      config = {
        username: 'admin',
        password: '888888',
        fontSize: 12,
        backupNumber: 10,
        predefine: [
          '#ff4500',
          '#ff8c00',
          '#ffd700',
          '#90ee90',
          '#00ced1',
          '#1e90ff',
          '#c71585',
          '#C40D0D',
          '#C4630D',
          '#0D9395',
          '#C00000',
          '#FF0000',
          '#FFC000',
          '#FFFF00',
          '#92D050',
          '#00B050',
          '#00B0F0',
          '#0070C0',
          '#002060',
          '#7030A0',
          '#FFFFFF',
          '#000000',
          '#E7E6E6',
          '#44546A',
          '#4472C4',
          '#ED7D31',
          '#A5A5A5',
          '#DABD00',
          '#5B9BD5',
          '#70AD47',
          '#BFBFBF',
          '#3F3F3F',
          '#757070',
          '#8496B0',
          '#8EAADB',
          '#F4B183',
          '#C9C9C9',
          '#FFD965',
          '#9CC3E5',
          '#A8D08D'
        ]
      }
      if (!err) {
        config = JSON.parse(data)
      }
      commit(LOAD_CONFIG, { config })
    })
  },
  writeConfig ({ commit, state }, fontSize) {
    state.config.fontSize = fontSize
    fs.writeFile('config.json', JSON.stringify(state.config, null, 2), (err) => {
      if (err) throw err
    })
  },
  async backupDB ({ commit, state }) {
    if (state.isBackup) return
    const dbPath = path.join(state.baseDir, 'database.db')
    const dbBackupPath = path.join(state.backupDir, `${moment().format('YYYY-MM-DD-HH-mm-ss')} database.db`)
    await copyFile(dbPath, dbBackupPath)
    // 判断备份文件数量是否大于配置设定值，如果大于则删除多余备份
    await fs.readdir(state.backupDir, (err, files) => {
      if (err) {
        throw err
      }
      // eslint-disable-next-line no-constant-condition
      if (files.length > state.config.backupNumber) {
        let deleteFiles = files.sort()
        deleteFiles = deleteFiles.splice(0, files.length - state.config.backupNumber)
        deleteFiles.forEach(file => {
          fs.unlinkSync(path.join(state.backupDir, file))
        })
      }
      commit(UPDATE_IS_BACKUP)
    })
  },
  updateIsMax ({ commit }, isMax) {
    commit(UPDATE_IS_MAX, { isMax })
  }
}

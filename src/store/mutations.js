import {
  UPDATE_STUDENT_LIST,
  UPDATE_TEACHER_LIST,
  UPDATE_COURSE_LIST,
  UPDATE_ORGANIZATION_LIST,
  LOAD_CONFIG,
  UPDATE_IS_BACKUP, UPDATE_IS_MAX
} from '@/store/mutation-types'

export default {
  [UPDATE_STUDENT_LIST] (state, { studentList }) {
    state.studentList = studentList
  },
  [UPDATE_TEACHER_LIST] (state, { teacherList }) {
    state.teacherList = teacherList
  },
  [UPDATE_COURSE_LIST] (state, { courseList }) {
    state.courseList = courseList
  },
  [UPDATE_ORGANIZATION_LIST] (state, { organizationList }) {
    state.organizationList = organizationList
  },
  [LOAD_CONFIG] (state, { config }) {
    state.config = config
  },
  [UPDATE_IS_BACKUP] (state) {
    state.isBackup = true
  },
  [UPDATE_IS_MAX] (state, { isMax }) {
    state.isMax = isMax
  }
}

import models from '@/db/models'
import { Op } from 'sequelize'
import { clone } from '@/utils'

export default {
  // 获取课程列表
  getCourseList: (state) => async (where, page, limit, order = [['id', 'DESC']]) => {
    let tempList = await models.Course.findAll({
      where,
      include: models.StudentCourse,
      attributes: ['id']
    })
    tempList = clone(tempList)
    let offset
    if (page && limit) {
      offset = limit * (page - 1)
    }
    const rows = clone(await models.Course.findAll({
      where: {
        id: {
          [Op.in]: tempList.map(item => item.id)
        }
      },
      // include: { all: true, nested: true },
      include: [
        {
          model: models.Teacher
        }, {
          model: models.Organization
        }, {
          model: models.StudentCourse,
          include: models.Student
        }
      ],
      limit,
      offset,
      order
    }))
    return { count: tempList.length, rows }
  },
  // 获取排课列表
  getScheduleList: (state) => async (where, page, limit, order = [['startAt']]) => {
    const tempList = await models.Schedule.findAll({
      where,
      include: models.StudentSchedule,
      attributes: ['id']
    })
    let offset
    if (page && limit) {
      offset = limit * (page - 1)
    }
    const rows = clone(await models.Schedule.findAll({
      where: {
        id: {
          [Op.in]: tempList.map(item => item.id)
        }
      },
      include: [
        {
          model: models.StudentSchedule,
          include: models.Student
        },
        {
          model: models.Teacher
        },
        {
          model: models.Organization
        }
      ],
      order,
      limit,
      offset
    }))
    return { rows, count: tempList.length }
  }
}

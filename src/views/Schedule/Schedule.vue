<template>
  <div class="schedule-page">
    <!--课程表区域-->
    <div class="calendar-wrap" :style="{width: isShowCourse ? 'calc(100% - 200px)' : '100%'}">
      <FullCalendar id="full-calendar" ref="fullCalendar" :options="calendarOptions"/>
    </div>
    <!--右侧课程信息区域-->
    <div class="course-wrap" :style="{right: isShowCourse ? '-20px' : '-220px'}">
      <!--展示收起-->
      <div class="course-wrap-switch" @click="showCourse">
        <i :class="[isShowCourse ? 'el-icon-d-arrow-right' : 'el-icon-d-arrow-left']"></i>
      </div>
      <!--课程搜索表单-->
      <el-form ref="courseFormRef" :model="courseForm" size="mini">
        <el-form-item>
          <el-input v-model="courseForm.name" placeholder="课程名称" clearable @input="getCourseList"></el-input>
        </el-form-item>
        <el-form-item>
          <el-select v-model="courseForm.teacherId" placeholder="老师" filterable clearable @change="getCourseList">
            <el-option v-for="item in teacherList" :key="item.id" :value="item.id" :label="item.name"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="courseForm.studentId" placeholder="学生" filterable clearable @change="getCourseList">
            <el-option v-for="item in studentList" :key="item.id" :value="item.id" :label="item.name"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="courseForm.org" placeholder="机构" filterable clearable @change="getCourseList">
            <el-option v-for="item in organizationList" :key="item.id" :value="item.id" :label="item.name"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <!--分割线-->
      <el-divider>
        <i class="el-icon-circle-plus add-course" title="添加课程" @click="courseDialogVisible=true"></i>
      </el-divider>
      <!--课程选择区-->
      <el-scrollbar style="height: calc(100% - 219px)" wrap-class="course-scrollbar-wrap">
        <div id='external-events'>
          <div v-for="course in courseList" @click="handleCourseClick(course.id)" :key="course.id" class='fc-event fc-h-event fc-daygrid-event fc-daygrid-block-event my-event' :courseId="course.id" :color="course.color" :style="{background: course.color}">
            <div class='fc-event-main my-event-main' :style="{color: findTextColor(course.color)}">{{course.StudentCourses.map(item => item.Student.name).join(',') + '\n' + course.name + '(' + course.Teacher.name + ')'}}</div>
          </div>
        </div>
      </el-scrollbar>
    </div>
    <!--条件筛选对话框-->
    <el-dialog title="筛选" :visible.sync="searchDialogVisible" width="300px">
      <el-form ref="searchFormRef" :model="searchForm" size="mini" label-width="60px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="searchForm.name" clearable></el-input>
        </el-form-item>
        <el-form-item label="老师" prop="teacherId">
          <el-select v-model="searchForm.teacherId" clearable filterable style="width: 100%">
            <el-option v-for="item in teacherList" :key="item.id" :value="item.id" :label="item.name"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="学生" prop="studentId">
          <el-select v-model="searchForm.studentId" clearable filterable style="width: 100%">
            <el-option v-for="item in studentList" :key="item.id" :value="item.id" :label="item.name"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="机构" prop="organizationId">
          <el-select v-model="searchForm.organizationId" clearable filterable style="width: 100%">
            <el-option v-for="item in organizationList" :key="item.id" :value="item.id" :label="item.name"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button type="primary" size="mini" @click="filterSchedule(false)">筛选</el-button>
        <el-button size="mini" type="warning" @click="filterSchedule(true)">重置</el-button>
        <el-button size="mini" @click="searchDialogVisible=false">取消</el-button>
      </span>
    </el-dialog>
    <!--设置字体对话框-->
    <el-dialog v-dialog-drag title="设置" :visible.sync="configDialogVisible" width="500px">
      <el-form label-position="top">
        <el-form-item label="字体大小">
          <el-slider v-model="fontSize" :max="21" :min="9" @change="handleSliderChange"></el-slider>
        </el-form-item>
        <el-form-item label="显示价格">
          <el-switch v-model="showDetailPrice"></el-switch>
        </el-form-item>
      </el-form>
    </el-dialog>
    <!--添加/编辑课程对话框-->
    <ScheduleForm :create="!currentSchedule" :visible.sync="visible" :data="currentSchedule" :start="selectStart" :end="selectEnd" @submitted="handleDialogSubmitted" @deleted="handleDialogDeleted" @closed="handleDialogClosed" @cloned="handleDialogCloned"/>
    <!--显示课程详细-->
    <ScheduleDetail :raw="currentHoverEvent" :showDetailPrice="showDetailPrice"/>
    <!--课程表单-->
    <CourseForm :create="!currentClickCourse" :data="currentClickCourse" :visible.sync="courseDialogVisible" @submitted="handleCourseFormSubmitted" @closed="handleCourseDialogClosed"/>
  </div>
</template>

<script>
import FullCalendar from '@fullcalendar/vue'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import momentPlugin from '@fullcalendar/moment'
import interactionPlugin, { Draggable } from '@fullcalendar/interaction'
import '@fullcalendar/core/locales/zh-cn' // 支持中文
import ScheduleForm from '@/components/Forms/ScheduleForm'
import ScheduleDetail from '@/components/ScheduleDetail/ScheduleDetail'
import CourseForm from '@/components/Forms/CourseForm'
import { Op } from 'sequelize'
import TEXTColor from 'textcolor'
import { mapState } from 'vuex'

export default {
  name: 'Schedule',
  components: {
    ScheduleForm,
    ScheduleDetail,
    CourseForm,
    FullCalendar // make the <FullCalendar> tag available
  },
  data () {
    return {
      copyKey: false, // 复制按键
      showDetailPrice: false, // 显示详细内容的价格
      searchDialogVisible: false, // 筛选表单对话框
      configDialogVisible: false, // 设置字体大小对话框
      courseDialogVisible: false, // 课程对话框开关
      fontSize: this.$store.state.config.fontSize, // 字体大小
      visible: false, // 添加/编辑课程对话框
      orgDialogVisible: false, // 机构管理对话框
      currentSchedule: null, // 当前点击的事件
      currentClickCourse: null, // 当前点击的课程
      scheduleList: [], // 排课列表
      courseList: [], // 课程列表
      isShowCourse: false, // 显示课程列表
      calendarApi: null, // calendar api
      draggable: null, // draggable
      selectStart: null,
      selectEnd: null,
      currentHoverEvent: null, // 当前鼠标所在的事件
      searchForm: { // 课程表条件搜索表单
        start: null,
        end: null,
        name: null,
        teacherId: null,
        studentId: null,
        organizationId: null
      },
      courseForm: { // 课程搜索表单数据
        org: null,
        teacherId: null,
        studentId: null,
        name: null
      },
      organizationForm: { // 机构管理表单
        name: null
      },
      organizationFormRules: { // 机构管理表单规则
        name: [
          { required: true, message: '请输入机构名称' }
        ]
      },
      scheduleForm: { // 课表的查询表单
        id: null,
        organization: null,
        start: null,
        end: null,
        name: null,
        color: null,
        teacherId: null,
        teacherPrice: null,
        students: [{
          studentScheduleId: null,
          studentId: null,
          studentPrice: null
        }]
      },
      scheduleFormRules: {
        organization: [
          { required: true, message: '请选择机构', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入课程名称', trigger: 'blur' }
        ],
        start: [
          { required: true, message: '请选择开始时间', trigger: 'blur' }
        ],
        end: [
          { required: true, message: '请选择结束时间', trigger: 'blur' }
        ],
        color: [
          { required: true, message: '请选择颜色', trigger: 'blur' }
        ],
        teacherId: [
          { required: true, message: '请选择老师', trigger: 'change' }
        ],
        teacherPrice: [
          { required: true, message: '请输入价格', trigger: 'blur' },
          { type: 'number', message: '价格必须为数值' }
        ]
      },
      editScheduleForm: {
        id: null,
        start: null,
        end: null
      },
      calendarOptions: {
        plugins: [dayGridPlugin, timeGridPlugin, momentPlugin, interactionPlugin],
        initialView: 'timeGridWeek',
        locale: 'zh-cn',
        customButtons: {
          search: {
            text: '筛选',
            click: this.filterButtonClick
          },
          reset: {
            text: '重置',
            click: this.resetSchedule
          },
          config: {
            text: '设置',
            click: this.configDialogOpen
          },
          clone: {
            text: '复制',
            click: this.cloneWeek
          }
        },
        headerToolbar: {
          left: 'prev,next search,reset config,clone',
          center: 'title',
          right: 'today dayGridMonth,timeGridWeek,timeGridDay'
        },
        weekText: '周', // 周的国际化,默认为"W"
        displayEventEnd: true,
        // contentHeight: 'auto',
        height: '100%',
        expandRows: true,
        firstDay: 1,
        weekNumberCalculation: 'ISO',
        slotMinTime: '07:00:00',
        slotMaxTime: '23:00:00',
        slotEventOverlap: false,
        fixedWeekCount: false, // 月视图中显示的星期数。如果为true，日历将始终为6周。如果为false，则日历将有4、5或6个星期，具体取决于月份。
        weekNumbers: true, // 是否显示第几周
        slotLabelFormat: 'HH:mm', // 左边的时间格式
        snapDuration: '02:00:00', // 其实就是动态创建一个日程时，默认创建多长的时间块
        allDaySlot: false,
        eventTimeFormat: 'HH:mm',
        selectable: true,
        droppable: true,
        editable: true,
        // lazyFetching: false,
        buttonText: {
          today: '今天',
          month: '月',
          week: '周',
          day: '天'
        },
        initialEvents: this.initialEvents,
        drop: this.drop,
        select: this.select,
        eventAdd: this.eventAdd,
        eventChange: this.eventChange,
        eventRemove: this.eventRemove,
        eventClick: this.eventClick,
        eventDragStart: this.eventDragStart,
        eventDrop: this.eventDrop,
        eventDragStop: this.eventDragStop,
        eventResize: this.eventResize,
        eventMouseEnter: this.eventMouseEnter,
        eventMouseLeave: this.eventMouseLeave,
        navLinks: true
      }
    }
  },
  computed: {
    ...mapState(['teacherList', 'studentList', 'organizationList'])
  },
  created () {
    this.getCourseList()
  },
  mounted () {
    this.calendarApi = this.$refs.fullCalendar.getApi()
    window.calendarApi = this.calendarApi
    window.vue = this
    this.draggable = new Draggable(document.getElementById('external-events'), {
      itemSelector: '.fc-event',
      eventData: (eventEl) => {
        return this.eventData(eventEl)
      }
    })
    window.document.documentElement.setAttribute('data-size', `${this.fontSize}`)
    this.handleCopyKey()
  },
  methods: {
    // 获取课程列表
    async getCourseList () {
      const where = { isDelete: false, isShow: true }
      if (this.courseForm.org) {
        where.OrganizationId = this.courseForm.org
      }
      if (this.courseForm.name) {
        where.name = { [Op.like]: `%${this.courseForm.name}%` }
      }
      if (this.courseForm.teacherId) {
        where.TeacherId = this.courseForm.teacherId
      }
      if (this.courseForm.studentId) {
        where['$StudentCourses.StudentId$'] = this.courseForm.studentId
      }
      const { rows } = await this.$store.getters.getCourseList(where)
      this.courseList = rows
    },
    // 获取排课列表
    async getScheduleList () {
      this.scheduleList = []
      const where = {
        startAt: {
          [Op.between]: [this.searchForm.start, this.searchForm.end]
        }
      }
      if (this.searchForm.name) {
        where.name = this.searchForm.name
      }
      if (this.searchForm.teacherId) {
        where.TeacherId = this.searchForm.teacherId
      }
      if (this.searchForm.studentId) {
        where['$StudentSchedules.StudentId$'] = this.searchForm.studentId
      }
      if (this.searchForm.organizationId) {
        where.OrganizationId = this.searchForm.organizationId
      }
      const { rows } = await this.$store.getters.getScheduleList(where)
      this.scheduleList = rows
    },
    // 课程筛选
    filterSchedule (reset) {
      if (reset) {
        this.$refs.searchFormRef.resetFields()
      }
      this.calendarApi.refetchEvents()
      this.searchDialogVisible = false
    },
    // 重置课程筛选
    resetSchedule () {
      this.filterSchedule(true)
    },
    // 打开设置对话框
    configDialogOpen () {
      this.configDialogVisible = true
    },
    // 复制当前周的课程
    async cloneWeek () {
      // dayGridMonth, timeGridWeek, timeGridDay
      if (this.calendarApi.view.type === 'dayGridMonth') {
        return this.$message.warning('仅能在周或日视图中进行复制')
      }
      const result = await this.$confirm('确定复制当前显示的数据到下周？', '提示', { type: 'warning' }).then(() => true).catch(() => false)
      if (!result) return

      const loading = this.$loading({
        lock: true,
        text: '复制课程中...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      })
      const temp = this.calendarApi.getDate()
      let start
      let interval
      if (this.calendarApi.view.type === 'timeGridWeek') {
        interval = 7
        start = this.getFirstDayOfWeek(temp)
      } else {
        interval = 1
        start = new Date(temp.getFullYear(), temp.getMonth(), temp.getDate())
      }
      const end = new Date(start.getTime() + 3600 * 1000 * 24 * interval)
      const scheduleList = this.calendarApi.getEvents().map(item => item.extendedProps)
      const cloneSchedules = scheduleList.filter(item => {
        const startAt = new Date(item.startAt)
        return startAt >= start && startAt < end
      })
      for (const schedule of cloneSchedules) {
        const startAt = new Date(new Date(schedule.startAt).getTime() + 3600 * 1000 * 24 * 7)
        const endAt = new Date(new Date(schedule.endAt).getTime() + 3600 * 1000 * 24 * 7)
        const schedules = await this.$models.Schedule.findAll({
          where: {
            startAt,
            endAt,
            name: schedule.name,
            teacherId: schedule.TeacherId,
            '$StudentSchedules.StudentId$': {
              [Op.in]: schedule.StudentSchedules.map(item => item.StudentId)
            }
          },
          include: {
            model: this.$models.StudentSchedule
          }
        })
        if (schedules.length) continue
        const nextStudentSchedules = []
        for (const item of schedule.StudentSchedules) {
          const studentSchedule = await this.$models.StudentSchedule.create({
            price: item.price,
            StudentId: item.StudentId
          })
          nextStudentSchedules.push(studentSchedule)
        }
        const nextSchedule = await this.$models.Schedule.create({
          OrganizationId: schedule.OrganizationId,
          name: schedule.name,
          teacherPrice: schedule.teacherPrice,
          TeacherId: schedule.TeacherId,
          color: schedule.color,
          startAt,
          endAt
        })
        await nextSchedule.setStudentSchedules(nextStudentSchedules)
      }
      this.calendarApi.refetchEvents()
      loading.close()
    },
    // 获取当前日期所在周的第一天（周一）
    getFirstDayOfWeek (date) {
      const weekday = date.getDay() || 7 // 获取星期几,getDay()返回值是 0（周日） 到 6（周六） 之间的一个整数。0||7为7，即weekday的值为1-7
      date.setDate(date.getDate() - weekday + 1) // 往前算（weekday-1）天，年份、月份会自动变化
      const newDate = new Date(this.$formatTime(date, 'YYYY-MM-DD'))
      newDate.setHours(0)
      return newDate
    },
    // 初始化数据
    async initialEvents (raw) {
      this.searchForm.start = raw.start
      this.searchForm.end = raw.end
      await this.getScheduleList()
      this.calendarApi.removeAllEvents()
      return this.scheduleList.map(schedule => {
        const title = schedule.StudentSchedules.map(item => item.Student.name).join(',') + '\n' + schedule.name + '(' + schedule.Teacher.name + ')'
        return {
          id: schedule.id,
          title,
          start: schedule.startAt,
          end: schedule.endAt,
          color: schedule.color,
          textColor: this.findTextColor(schedule.color),
          extendedProps: schedule
        }
      })
    },
    // 显示课程列表
    showCourse () {
      this.isShowCourse = !this.isShowCourse
      setTimeout(() => {
        const calendarApi = this.$refs.fullCalendar.getApi()
        calendarApi.updateSize()
      }, 300)
    },
    // 删除课程
    async deleteSchedule () {
      const scheduleId = this.currentSchedule.id
      await this.currentSchedule.destroy()
      const event = this.calendarApi.getEventById(scheduleId)
      event.remove()
      this.$message.success('删除成功')
      // this.calendarApi.refetchEvents()
      this.editScheduleDialogVisible = false
    },
    // 外部拖拽事件
    eventData (eventEl) {
      const courseId = eventEl.getAttribute('courseId')
      const color = eventEl.getAttribute('color')
      const title = eventEl.firstChild.innerHTML
      return {
        title,
        id: courseId,
        duration: '02:00',
        create: false,
        color,
        textColor: this.findTextColor(color)
      }
    },
    // 添加排课
    async addSchedule (courseId, startAt, endAt) {
      const course = await this.$models.Course.findByPk(courseId)
      if (course === null) {
        this.$message.error('创建失败，未找到该课程')
        return
      }
      const studentCourses = await this.$models.StudentCourse.findAll({
        where: {
          CourseId: course.id
        }
      })
      const studentSchedules = []
      for (let i = 0; i < studentCourses.length; i++) {
        const studentCourse = studentCourses[i]
        const studentSchedule = await this.$models.StudentSchedule.create({
          price: studentCourse.price,
          StudentId: studentCourse.StudentId
        })
        studentSchedules.push(studentSchedule)
      }
      const schedule = await this.$models.Schedule.create({
        name: course.name,
        OrganizationId: course.OrganizationId,
        color: course.color,
        teacherPrice: course.teacherPrice,
        TeacherId: course.TeacherId,
        startAt,
        endAt
      })
      await schedule.setStudentSchedules(studentSchedules)
      const newSchedule = await this.$models.Schedule.findOne({
        where: {
          id: schedule.id
        },
        include: [
          {
            model: this.$models.Organization
          },
          {
            model: this.$models.Teacher
          },
          {
            model: this.$models.StudentSchedule,
            include: this.$models.Student
          }
        ]
      })
      return this.$toJson(newSchedule)
    },
    // 更新课程的时间
    async updateSchedule (raw) {
      const event = raw.event
      const id = event.id
      const start = event.start
      const end = event.end
      const schedule = await this.$models.Schedule.findByPk(id)
      if (schedule === null) {
        return this.$message.error('未找到数据')
      }
      schedule.startAt = start
      schedule.endAt = end
      await schedule.save()
      event.setExtendedProp('startAt', start.toISOString())
      event.setExtendedProp('endAt', end.toISOString())
    },
    // 外部拖拽事件
    async drop (raw) {
      console.log('drop', raw)
      let start
      if (raw.allDay) {
        start = new Date(raw.date.getTime() + 3600 * 1000 * 8)
      } else {
        start = raw.date
      }
      const end = new Date(start.getTime() + 3600 * 1000 * 2)
      const draggedEl = raw.draggedEl
      const courseId = draggedEl.getAttribute('courseId')
      const bgColor = getComputedStyle(draggedEl).getPropertyValue('background-color')
      const title = draggedEl.innerText
      // 临时添加事件
      this.calendarApi.addEvent({
        id: `course-${courseId}`,
        title,
        start,
        end,
        color: bgColor,
        textColor: this.findTextColor(bgColor)
      })
      const schedule = await this.addSchedule(courseId, start, end)
      // 删除临时事件
      this.calendarApi.getEventById(`course-${courseId}`).remove()
      // 添加真正的事件
      this.calendarApi.addEvent({
        id: schedule.id,
        title,
        start: schedule.startAt,
        end: schedule.endAt,
        color: schedule.color,
        textColor: this.findTextColor(schedule.color),
        extendedProps: schedule
      })
      // this.calendarApi.refetchEvents()
    },
    // 选择事件
    select (raw) {
      if (!this.isShowCourse) return
      if (raw.allDay) {
        this.selectStart = new Date(raw.start.getTime() + 3600 * 1000 * 8)
        this.selectEnd = new Date(this.selectStart.getTime() + 3600 * 1000 * 2)
      } else {
        this.selectStart = raw.start
        this.selectEnd = raw.end
      }
      this.currentSchedule = null
      this.visible = true
    },
    // 事件添加后的回调
    eventAdd (raw) {
      console.log('eventAdd', raw)
    },
    // 事件位置或尺寸改变
    async eventChange (raw) {
      console.log('eventChange', raw)
    },
    // 事件删除后的回调
    eventRemove (raw) {
      console.log('eventRemove', raw)
    },
    // 事件点击
    async eventClick (eventClickInfo) {
      console.log('eventClick', eventClickInfo)
      if (eventClickInfo.event.id.indexOf('course') !== -1) {
        return
      }
      this.currentSchedule = eventClickInfo.event.extendedProps
      this.visible = true
    },
    // 日程表里事件开始拖拽
    async eventDragStart (raw) {
      console.log('eventDragStart', raw)
      this.currentHoverEvent = null
      if (!this.copyKey) return
      const event = raw.event
      const schedule = event.extendedProps
      this.calendarApi.addEvent({
        id: `course-${schedule.id}`,
        title: event.title,
        start: event.start,
        end: event.end,
        color: schedule.color,
        textColor: this.findTextColor(schedule.color)
      })
      const cloneStudentSchedules = []
      for (const item of schedule.StudentSchedules) {
        const cloneStudentSchedule = await this.$models.StudentSchedule.create({
          price: item.price,
          StudentId: item.StudentId
        })
        cloneStudentSchedules.push(cloneStudentSchedule)
      }
      const cloneSchedule = await this.$models.Schedule.create({
        OrganizationId: schedule.OrganizationId,
        name: schedule.name,
        TeacherId: schedule.TeacherId,
        teacherPrice: schedule.teacherPrice,
        color: schedule.color,
        startAt: schedule.startAt,
        endAt: schedule.endAt
      })
      await cloneSchedule.setStudentSchedules(cloneStudentSchedules)
      const newSchedule = this.$toJson(await this.$models.Schedule.findOne({
        where: {
          id: cloneSchedule.id
        },
        include: [
          {
            model: this.$models.Teacher
          },
          {
            model: this.$models.Organization
          },
          {
            model: this.$models.StudentSchedule,
            include: this.$models.Student
          }
        ]
      }))
      this.calendarApi.getEventById(`course-${schedule.id}`).remove()
      this.calendarApi.addEvent({
        id: newSchedule.id,
        title: event.title,
        start: event.start,
        end: event.end,
        color: schedule.color,
        textColor: this.findTextColor(schedule.color),
        extendedProps: newSchedule
      })
    },
    eventDragStop (raw) {
      console.log('eventDragStop', raw)
    },
    eventDrop (raw) {
      console.log('eventDrop', raw)
      this.updateSchedule(raw)
    },
    eventResize (raw) {
      console.log('eventResize', raw)
      this.updateSchedule(raw)
    },
    // 鼠标进入事件
    eventMouseEnter (raw) {
      console.log('eventMouseEnter', raw)
      if (raw.event.id.indexOf('course') !== -1) {
        return
      }
      this.currentHoverEvent = raw
    },
    // 鼠标离开事件
    eventMouseLeave (raw) {
      this.currentHoverEvent = null
    },
    // 计算字体颜色
    findTextColor (color) {
      return TEXTColor.findTextColor(color)
    },
    // 自定义筛选按钮点击
    filterButtonClick () {
      this.searchDialogVisible = true
    },
    // 课程点击事件
    async handleCourseClick (id) {
      console.log(id)
      const course = await this.$models.Course.findOne({
        where: {
          id
        },
        include: {
          model: this.$models.StudentCourse
        }
      })
      if (course === null) return
      this.currentClickCourse = course
      this.courseDialogVisible = true
    },
    // 处理滑块值变化
    handleSliderChange (val) {
      window.document.documentElement.setAttribute('data-size', `${val}`)
      this.$store.dispatch('writeConfig', val)
    },
    // 监听对话框提交后
    handleDialogSubmitted () {
      this.calendarApi.refetchEvents()
    },
    // 监听课程表单提交
    handleCourseFormSubmitted () {
      this.getCourseList()
    },
    // 监听课程表单对话框关闭
    handleCourseDialogClosed () {
      this.currentClickCourse = null
    },
    // 监听对话框删除后
    handleDialogDeleted (scheduleId) {
      const event = this.calendarApi.getEventById(scheduleId)
      if (event) {
        event.remove()
      }
    },
    // 监听编辑课程对话框打开
    handleDialogClosed () {
      this.currentSchedule = null
    },
    // 监听编辑课程对话框复制完成
    handleDialogCloned () {
      this.calendarApi.refetchEvents()
    },
    // 监听键盘是否按住shift键
    handleCopyKey () {
      document.onkeydown = (e) => {
        this.copyKey = e.shiftKey
      }
      document.onkeyup = () => {
        this.copyKey = false
      }
    }
  }
}
</script>

<style scoped rel="stylesheet/scss" lang="scss">
  @import "~@/assets/scss/variable.scss";
  @import "~@/assets/scss/mixin.scss";
  .schedule-page {
    height: 100%;
    position: relative;
    .calendar-wrap {
      transition: width .3s;
      height: 100%;
      ::v-deep {
        .fc-event-title {
          white-space: pre-wrap;
        }
        .fc-timegrid-event {
          @include add-size($font_size_12);
          //font-size: var(--fc-small-font-size, 1em);
        }
        .fc-daygrid-event {
          @include add-size($font_size_12);
          //font-size: var(--fc-small-font-size, 1em);
        }
      }
    }
    .course-wrap {
      position: absolute;
      right: -20px;
      top: -20px;
      z-index: 9;
      width: 200px;
      height: calc(100% + 40px);
      padding: 10px;
      box-sizing: border-box;
      background: #f1f1f1;
      transition: right .3s;
      ::v-deep {
        .course-scrollbar-wrap {
          overflow-x: hidden;
        }
        .fc-daygrid-event {
          font-size: var(--fc-small-font-size, 1em);
        }
        .el-divider__text {
          background-color: #F1F1F1;
        }
      }
      .course-wrap-switch {
        cursor: pointer;
        position: absolute;
        width: 20px;
        height: 40px;
        left: 0;
        top: 50%;
        transform: translate(-20px, -50%);
        border-radius: 40px 0 0 40px;
        background: #9a6e3a;
        font-size: 16px;
        font-weight: bolder;
        line-height: 40px;
        text-align: center;
        color: #ddd;
        i {
          margin-left: 5px;
        }
      }
      .add-course {
        cursor: pointer;
        color: #67C23A;
      }
      .my-event {
        margin-bottom: 10px;
        cursor: pointer;
        .my-event-main {
          white-space: pre-line;
          padding: 3px 10px;
        }
      }
    }
  }
</style>

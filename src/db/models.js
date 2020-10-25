import { DataTypes } from 'sequelize'
import sequelize from './sequelize'

const Teacher = sequelize.define('Teacher', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    unique: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  gender: DataTypes.STRING(5),
  price: DataTypes.DECIMAL(10, 2),
  remark: DataTypes.TEXT,
  isShow: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isDelete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
})

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    unique: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  gender: DataTypes.STRING(5),
  grade: DataTypes.STRING(10),
  price: DataTypes.DECIMAL(10, 2),
  remark: DataTypes.TEXT,
  isShow: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isDelete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
})

const StudentCourse = sequelize.define('StudentCourse', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    unique: true,
    primaryKey: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2)
  }
})

const Organization = sequelize.define('Organization', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    unique: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING
  },
  isShow: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isDelete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
})

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    unique: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  teacherPrice: {
    type: DataTypes.DECIMAL(10, 2)
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#3788D8'
  },
  isShow: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isDelete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
})

const Schedule = sequelize.define('Schedule', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    unique: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  teacherPrice: {
    type: DataTypes.DECIMAL(10, 2)
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#3788D8'
  },
  startAt: {
    type: DataTypes.DATE
  },
  endAt: {
    type: DataTypes.DATE
  },
  duration: {
    type: DataTypes.VIRTUAL,
    get () {
      const temp = (this.endAt.getTime() - this.startAt.getTime()) / 1000 / 60 / 60
      return parseFloat(temp.toFixed(2))
    }
  }
})

const StudentSchedule = sequelize.define('StudentSchedule', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    unique: true,
    primaryKey: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2)
  }
})

const Trusteeship = sequelize.define('Trusteeship', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    unique: true,
    primaryKey: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  remark: {
    type: DataTypes.TEXT
  },
  month: {
    type: DataTypes.STRING, // 格式如 2020-09
    allowNull: false
  }
})

const Others = sequelize.define('Others', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    unique: true,
    primaryKey: true
  },
  cat: {
    type: DataTypes.STRING(5),
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  remark: {
    type: DataTypes.TEXT
  },
  month: {
    type: DataTypes.STRING, // 格式如 2020-09
    allowNull: false
  }
})

Organization.hasMany(Course)
Course.belongsTo(Organization)
Organization.hasMany(Schedule)
Schedule.belongsTo(Organization)
Student.hasMany(StudentCourse, {
  onDelete: 'CASCADE'
})
StudentCourse.belongsTo(Student)
Teacher.hasMany(Course)
Course.belongsTo(Teacher)
Course.hasMany(StudentCourse, {
  onDelete: 'CASCADE'
})
StudentCourse.belongsTo(Course)
Teacher.hasMany(Schedule)
Schedule.belongsTo(Teacher)
Student.hasMany(StudentSchedule)
StudentSchedule.belongsTo(Student)
Schedule.hasMany(StudentSchedule, {
  onDelete: 'CASCADE'
})
StudentSchedule.belongsTo(Schedule)
Student.hasMany(Trusteeship)
Trusteeship.belongsTo(Student);

(async () => {
  // 如果表不存在，则会创建表（如果已经存在，则不执行任何操作）
  await sequelize.sync()
  // 这将创建表，如果该表已经存在，则将其首先删除
  // await sequelize.sync({ force: true })
  // 这将检查数据库中表的当前状态（它具有哪些列，它们的数据类型等），然后在表中进行必要的更改以使其与模型匹配。
  // await sequelize.sync({ alter: true })
  await Organization.findOrCreate({
    where: {
      id: 1
    },
    defaults: {
      name: '补习社'
    }
  })
})()

const models = {
  Teacher,
  Student,
  StudentCourse,
  Course,
  Schedule,
  StudentSchedule,
  Organization,
  Trusteeship,
  Others
}

export default models

import fs from 'fs'
import path from 'path'
import moment from 'moment'

// 获取当前月份的时间
export function getCurrentMonth () {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth())
}
// 根据传入的月份获取下个月
export function getNextMonth (month) {
  const thisMonth = new Date(month)
  return moment(new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1)).format('YYYY-MM')
}
// 克隆数据
export function clone (data) {
  return JSON.parse(JSON.stringify(data, null, 2))
}
// 创建目录
export async function mkdir (dirname) {
  await fs.stat(dirname.replace('\\', '/'), err => {
    if (err) {
      fs.mkdirSync(dirname, { recursive: true })
    }
  })
}
// 复制文件
export async function copyFile (src, target) {
  target = target.replace('\\', '/')
  await fs.readFile(src, async (err, data) => {
    if (err) {
      throw err
    }
    const dirname = path.dirname(target)
    await mkdir(dirname)
    await fs.writeFile(target.replace('\\', '/'), data, (err) => {
      if (err) {
        throw err
      }
    })
  })
}

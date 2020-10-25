import Vue from 'vue'
import {
  Button,
  ButtonGroup,
  Form,
  FormItem,
  Message,
  Input,
  Container,
  Header,
  Aside,
  Main,
  Menu,
  MenuItem,
  MenuItemGroup,
  Scrollbar,
  Table,
  TableColumn,
  Dialog,
  RadioGroup,
  Radio,
  Pagination,
  Switch,
  Popconfirm,
  Popover,
  Select,
  Option,
  Row,
  Col,
  Loading,
  Tag,
  Divider,
  ColorPicker,
  DatePicker,
  Tabs,
  TabPane,
  Slider,
  MessageBox
} from 'element-ui'

Vue.use(Button)
Vue.use(ButtonGroup)
Vue.use(Form)
Vue.use(FormItem)
Vue.use(Input)
Vue.use(Container)
Vue.use(Header)
Vue.use(Aside)
Vue.use(Main)
Vue.use(Menu)
Vue.use(MenuItem)
Vue.use(MenuItemGroup)
Vue.use(Scrollbar)
Vue.use(Table)
Vue.use(TableColumn)
Vue.use(Dialog)
Vue.use(RadioGroup)
Vue.use(Radio)
Vue.use(Pagination)
Vue.use(Switch)
Vue.use(Popconfirm)
Vue.use(Popover)
Vue.use(Select)
Vue.use(Option)
Vue.use(Row)
Vue.use(Col)
Vue.use(Tag)
Vue.use(Divider)
Vue.use(ColorPicker)
Vue.use(DatePicker)
Vue.use(Tabs)
Vue.use(TabPane)
Vue.use(Slider)
Vue.use(Loading.directive)

Vue.prototype.$message = Message
Vue.prototype.$loading = Loading.service
Vue.prototype.$confirm = MessageBox.confirm

<template>
  <div class="login">
    <TopBar/>
    <div class="login-box">
      <img src="@/assets/images/login.png" alt="">
      <el-form ref="loginFormRef" :model="loginForm" :rules="loginFormRules">
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" v-focus prefix-icon="el-icon-user" placeholder="账号" @keyup.enter.native="gotoLogin"></el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="loginForm.password" prefix-icon="el-icon-lock" placeholder="密码" type="password" @keyup.enter.native="gotoLogin"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" style="width: 100%" @click="gotoLogin">登 录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import TopBar from '@/components/TopBar/TopBar'
import { mapState } from 'vuex'
// const { ipcRenderer } = require('electron')

export default {
  name: 'Login',
  components: {
    TopBar
  },
  data () {
    return {
      loginForm: {
        username: '',
        password: ''
      },
      loginFormRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    ...mapState(['config'])
  },
  mounted () {
    // ipcRenderer.send('loginThrough')
  },
  directives: {
    // 注册一个局部的自定义指令 v-focus
    focus: {
      // 指令的定义
      inserted: function (el) {
        // 聚焦元素
        el.querySelector('input').focus()
      }
    }
  },
  methods: {
    gotoLogin () {
      this.$refs.loginFormRef.validate(valid => {
        if (valid) {
          if (this.loginForm.username === this.config.username && this.loginForm.password === this.config.password) {
            this.$router.push({ name: 'Schedule' })
            // ipcRenderer.send('loginThrough')
          } else {
            // this.$message.error('用户名或密码错误')
            this.$message({
              message: '用户名或密码错误',
              type: 'error',
              offset: 40
            })
          }
        }
      })
    }
  }
}
</script>

<style scoped lang="scss">
  .login {
    width: 100%;
    height: 100%;
    background: #2D3643;
    position: relative;
    .login-box {
      width: 300px;
      position: absolute;
      top: 45%;
      left: 50%;
      transform: translate(-50%, -50%);
      img {
        width: 200px;
        clear: both;
        display: block;
        margin: auto;
      }
      ::v-deep .el-input__inner {
        background-color: #29313D !important;
        border-color: #1a252f;
        color: #ffffff;
      }
    }
  }
</style>

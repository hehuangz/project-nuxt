<template>
  <div class="login-container">
    <el-form
      class='login-form'
      label-width="100px"
      :model="form"
      :rules="rules"
      ref="loginForm">

      <div class="title-container">
        <img src="/logo.png" alt="">
      </div>

      <el-form-item prop="email" label="邮箱">
        <el-input v-model="form.email" placeholder="请输入邮箱"></el-input>
      </el-form-item>

      <el-form-item prop="pwd" label="密码">
        <el-input type="password" v-model="form.pwd" placeholder="请输入密码"></el-input>
      </el-form-item>

      <el-form-item prop="captcha" label="验证码" class="captcha-container" >
        <div class="captcha">
          <img :src="code.captcha" @click="resetCaptcha">
        </div>
        <el-input v-model="form.captcha" placeholder="请输入验证码"></el-input>
      </el-form-item>

      <el-form-item label="">
        <el-button type="primary" @click.native.prevent="handleLogin">登录</el-button>
        <nuxt-link to="/register">
          <el-button>去注册</el-button>
        </nuxt-link>
      </el-form-item>

    </el-form>
  </div>
</template>

<script>
import md5 from 'md5'
export default {
  layout: 'login',
  data () {
    return {
      send: {
        timer: 0
      },
      form: {
        email: "hehuan07@qq.com",
        pwd: "123456",
        captcha: ""
      },
      rules: {
        email: [
          { required: true, message: "请输入邮箱" },
          { type: 'email', message: "请输入正确的邮箱格式" },
        ],
        captcha: [
          { required: true, message: "请输入验证码" },
        ],
        pwd: [
          { required: true, pattern: /^[\w_-]{6,12}$/g, message: "请输入6~12位密码" },
        ]
      },
      code:{
        captcha: "/api/captcha"
      }
    }
  },
  computed: {
    sendText () {
      if(this.send.timer <= 0){
        return '发送'
      }
      return `${this.send.timer}s后发送`
    }
  },
  methods: {
    resetCaptcha () {
      this.code.captcha = '/api/captcha?_t'+new Date().getTime()
    },
    handleLogin () {
      this.$refs.loginForm.validate( async valid=>{
        if (valid) {
          // @todo 发送注册请求
          let obj = {
            email: this.form.email,
            pwd: md5(this.form.pwd),
            captcha: this.form.captcha,
          }
          let ret = await this.$http.post('/user/login', obj)
          // code=0 就是成功
          if (ret.code === 0){
            this.$router.push("/")
          } else {
            this.$message.error(ret.message)
          }
        }else {
          console.log('校验失败')
        }
      })
    }

  }
}
</script>

<style lang="stylus">
</style>

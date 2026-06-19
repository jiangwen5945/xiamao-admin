<template>
  <div class="login-container">
    <el-card class="box-card">
      <h3>后台管理登录</h3>
      <el-form :model="form" status-icon :rules="rules" ref="formRef">
        <el-form-item prop="username">
          <el-input v-model="form.username" prefix-icon="el-icon-user"></el-input>
        </el-form-item>
        <el-form-item prop="password" style="margin-bottom: 10px;">
          <el-input v-model="form.password" prefix-icon="el-icon-key" show-password></el-input>
        </el-form-item>

        <el-form-item style="margin-bottom: 10px;">
          <div class="save-wrap">
            <el-checkbox v-model="rememberCheck">记住密码</el-checkbox>
            <el-link :underline="false">忘记密码</el-link>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin()" style="width: 100%;" :disabled="!isSubmit">登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>
<script>
import Cookie from 'js-cookie'
import rules from '@/utils/rules';
import { sha256 } from '@/utils/hash'
import { login, getUserMenus, getUserDetail } from '../api'
import { mapMutations } from 'vuex'

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return {}
  }
}

export default {
  name: 'LoginView',
  data() {
    return {
      form: {
        username: "",
        password: ""
      },
      rememberCheck: true,
      rules
    }
  },
  mounted() {
    document.addEventListener('keydown', this.keyUpSubmit)
  },
  beforeDestroy() {
    document.removeEventListener('keydown',this.keyUpSubmit)
  },
  computed: {
    isSubmit() {
      return !!this.form.username && !!this.form.password
    }
  },
  methods: {
    ...mapMutations(['setMenuArray', 'addMenuToRouter', 'setUserInfo']),
    async handleLogin() {
      const isRule = await this.$refs.formRef.validate()
      if (!isRule) return
      const res = await login(this.form)
      if (!res) return
      Cookie.set('token', res.token)
      // 设置用户密码哈希值
      sessionStorage.setItem('lockHash', await sha256(this.form.password))
      const { userId } = parseJwt(res.token)
      const [menus, user] = await Promise.all([
        getUserMenus(),
        getUserDetail({ id: userId })
      ])
      this.setMenuArray(menus)
      this.setUserInfo(user)
      this.addMenuToRouter(this.$router)
      this.$message.success('登录成功!')
      this.$router.push('./home')
    },
    // 回车登录
    keyUpSubmit() {
        let key = window.event.keyCode;
        if (key === 13) {
          this.handleLogin();
        }
    },
  }
}
</script>
<style lang="scss" scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  background: url('@/assets/bg.svg');
  height: 100vh;
}

.box-card {
  width: 400px;
  text-align: center;
  position: absolute;
  padding: 10px 20px;
  border-radius: 8px;

  h3 {
    margin-bottom: 22px;
  }

  .save-wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 6px;
  }
}
</style>
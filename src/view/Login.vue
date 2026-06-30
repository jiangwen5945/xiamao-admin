<template>
  <div class="login-container">
    <div class="login-bg">
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
      <div class="bg-circle bg-circle-3"></div>
    </div>
    <transition name="fade-up" appear>
      <div class="login-card">
        <div class="login-header">
          <div class="logo-wrapper">
            <img class="logo" src="@/assets/logo.png" alt="瞎猫管理系统" />
          </div>
          <h3 class="title">瞎猫管理系统</h3>
          <p class="subtitle">欢迎回来，请登录您的账号</p>
        </div>
        <el-form :model="form" status-icon :rules="rules" ref="formRef" class="login-form">
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="用户名"
              prefix-icon="el-icon-user"
            ></el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              placeholder="密码"
              prefix-icon="el-icon-key"
              show-password
            ></el-input>
          </el-form-item>
          <div class="form-divider"></div>
          <el-form-item>
            <el-button
              type="primary"
              @click="handleLogin()"
              class="login-btn"
              :loading="loading"
              :disabled="!isSubmit || loading"
            >
              {{ loading ? '登录中...' : '登 录' }}
            </el-button>
          </el-form-item>
        </el-form>
        <div class="login-footer">版本 v1.0</div>
      </div>
    </transition>
  </div>
</template>
<script>
import Cookie from 'js-cookie'
import rules from '@/utils/rules';
import { sha256 } from '@/utils/hash'

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
      rules,
      loading: false,
    }
  },
  mounted() {
    document.addEventListener('keydown', this.keyUpSubmit)
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.keyUpSubmit)
  },
  computed: {
    isSubmit() {
      return !!this.form.username && !!this.form.password
    }
  },
  methods: {
    async handleLogin() {
      try {
        const isRule = await this.$refs.formRef.validate()
        if (!isRule) return
        this.loading = true
        const res = await this.$api.login(this.form)
        if (!res) {
          this.loading = false
          return
        }
        Cookie.set('token', res.token)
        localStorage.setItem('lockHash', await sha256(this.form.password))
        const { userId } = parseJwt(res.token)
        const [menus, user] = await Promise.all([
          this.$api.getUserMenus(),
          this.$api.getUserDetail({ id: userId })
        ])
        await this.$store.dispatch('updateMenuArray', menus)
        await this.$store.dispatch('updateUserInfo', user)
        const userRoles = user.Roles || []
        if (userRoles.length) {
          await this.$store.dispatch('updateCurrentRole', userRoles[0])
        }
        await this.$store.dispatch('addMenuToRouter', this.$router)
        this.$message.success('登录成功!')
        this.$router.push('/home').catch(err => {
          if (err.name !== 'NavigationDuplicated') console.warn(err)
        })
      } catch (e) {
        this.loading = false
      }
    },
    keyUpSubmit(e) {
      if (e.key === 'Enter') {
        this.handleLogin()
      }
    },
  }
}
</script>
<style lang="scss" scoped>
$primary: #2563EB;
$primary-light: #3B82F6;
$bg-light: #F0F4FF;
$bg-dark: #0F172A;
$card-bg-light: #FFFFFF;
$card-bg-dark: #1E293B;

.login-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  overflow: hidden;
  background: var(--color-background, $bg-light);
}

.login-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}

.bg-circle-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, $primary, transparent 70%);
  top: -150px;
  right: -100px;
  animation: float 8s ease-in-out infinite;
}

.bg-circle-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, $primary-light, transparent 70%);
  bottom: -100px;
  left: -80px;
  animation: float 10s ease-in-out infinite reverse;
}

.bg-circle-3 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, #818CF8, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: float 12s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, -30px); }
}

.login-card {
  position: relative;
  width: 400px;
  padding: 40px;
  background: var(--color-card-bg, $card-bg-light);
  border-radius: 16px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 20px 40px -4px rgba(37, 99, 235, 0.1);
  z-index: 1;
  transition: background 0.3s, box-shadow 0.3s;
}

:root .custom-dark .login-card {
  background: var(--color-card-bg, $card-bg-dark);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.2),
    0 10px 15px -3px rgba(0, 0, 0, 0.3),
    0 20px 40px -4px rgba(0, 0, 0, 0.4);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.logo {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  object-fit: cover;
}

.title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 600;
  color: var(--color-font, #0F172A);
  letter-spacing: 0.5px;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: #94A3B8;
}

.login-form {
  :deep(.el-form-item) {
    margin-bottom: 28px;
  }

  :deep(.el-input__inner) {
    height: 44px;
    border-radius: 10px;
    font-size: 14px;
    padding-left: 46px;
    border: 1.5px solid #E2E8F0;
    background: #F8FAFC;
    transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;

    &:focus {
      border-color: $primary;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      background: #fff;
    }
  }

  :deep(.el-input__prefix) {
    left: 6px;
    font-size: 18px;
    color: #94A3B8;
    transition: color 0.25s;
  }

  :deep(.el-input.is-focus) {
    .el-input__prefix {
      color: $primary;
    }
  }
}

:root .custom-dark .login-form {
  :deep(.el-input__inner) {
    border-color: #334155;
    background: #1E293B;
    color: #E2E8F0;

    &:focus {
      border-color: $primary;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
      background: #1E293B;
    }
  }

  :deep(.el-input__prefix) {
    color: #64748B;
  }
}

.form-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, #E2E8F0, transparent);
  margin: 4px 0 20px;
}

:root .custom-dark .form-divider {
  background: linear-gradient(to right, transparent, #334155, transparent);
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 12px;
  color: #94A3B8;
  letter-spacing: 0.5px;
}

.login-btn {
  width: 100%;
  height: 44px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 3px;
  border: none;
  background: linear-gradient(135deg, $primary, $primary-light);
  transition: opacity 0.25s, transform 0.25s, box-shadow 0.25s;

  &:hover {
    opacity: 0.92;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.fade-up-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-up-enter {
  opacity: 0;
  transform: translateY(20px);
}

@media (max-width: 480px) {
  .login-card {
    width: calc(100% - 48px);
    padding: 32px 24px;
    border-radius: 12px;
  }

  .bg-circle-1 {
    width: 300px;
    height: 300px;
  }

  .bg-circle-2 {
    width: 250px;
    height: 250px;
  }

  .bg-circle-3 {
    width: 200px;
    height: 200px;
  }

  .title {
    font-size: 20px;
  }
}
</style>

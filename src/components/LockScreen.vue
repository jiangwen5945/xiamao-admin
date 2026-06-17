<template>
  <div class="lock-screen" v-show="$store.state.setting.isLockScreen">
    <div class="content-box">
      <img class="avatar" :src="userInfo.avatar" alt="" />
      <span class="info"> {{ userInfo.role }}: {{ userInfo.userName }} </span>

      <el-input v-model="form.passWord" type="password" placeholder="请输入当前用户密码" show-password prefix-icon="el-icon-key"
        size="large" style="width: 70%">
        <template #append>
          <i class="el-icon-unlock" @click="handleUnlock()" style="font-size: 18px;" />
        </template>
      </el-input>
    </div>
  </div>
</template>
<script>

import { sha256 } from '@/utils/hash'
export default {
  data() {
    return {
      timer: null,
      form: {
        userName: '',
        passWord: ''
      },
      leaveTime: '',
    };
  },
  computed: {
    userInfo() {
      return this.$store.state.tab.userInfo || JSON.parse(localStorage.getItem('userInfo'))
    }
  },
  mounted() {
    document.addEventListener('visibilitychange', this.handleVisiable)
    document.addEventListener('keydown', this.keyUpSubmit)
  },
  watch: {
    "$store.state.setting.isLockScreen": {
      immediate: true,
      handler(val) {
        this.isView(!val)
      }
    }
  },
  methods: {
    // 处理当前页面可见状态
    handleVisiable(e) {
      switch (e.target.visibilityState) {
        case 'prerender':
          console.log('prerender');
          break;
        case 'hidden':
          // 记录不住当前页面的开始时间点
          this.leaveTime = new Date().getTime()
          break;
        case 'visible':
          // 离开页面3分钟后自动开启屏幕内容保护
          if (new Date().getTime() - this.leaveTime > 1000 * 60 * 3) {
            this.handleLock()
          }
          break;
      }
    },
    // 开启屏幕保护
    handleLock() {
      this.$store.dispatch('setting/setLockScreen', true)
    },
    // 解除屏幕锁定
    async handleUnlock() {
      if (this.form.passWord === '') return
      const savedHash = sessionStorage.getItem('lockHash')
      if (await sha256(this.form.passWord) !== savedHash) {
        this.$message.error('密码错误')
        return
      }
      this.$store.dispatch('setting/setLockScreen', false)
      this.$notify({
        message: '欢迎回来！',
        type: 'success',
        duration: 1200
      })
    },
    // 回车登录
    keyUpSubmit() {
      if (window.event.keyCode === 13) {
        this.handleUnlock();
      }
    },

    // 是否禁用元素审查
    isView(e) {
      if (e) {
        document.onkeydown = null
        document.oncontextmenu = null
      } else {
        // 禁用f12
        document.onkeydown = () => {
          if (window.event && window.event.keyCode == 123) {
            this.$message({
              message: '已锁定',
              type: 'warning'
            })
            return false;
          }
        }
        // 禁用右键
        document.oncontextmenu = () => false
      }
    }
  },
  beforeDestroy() {
    document.removeEventListener('visibilitychange', this.handleVisiable)
    document.removeEventListener('keydown', this.keyUpSubmit)
  }
};
</script>
<style lang="scss" scoped>
.lock-screen {
  width: 100%;
  height: 100%;
  background: #00000087;
  backdrop-filter: blur(6px);
  z-index: 999;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;

  .content-box {
    width: 30%;
    background: #fff;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin: o auto;
    align-items: center;
    transform: translateY(-120px);
    border-radius: 10px;
    padding-bottom: 34px;

    .avatar {
      border-radius: 50%;
      width: 100px;
      transform: translateY(-26px);
    }

    .info {
      font-size: 16px;
      color: #4d4d4d;
      margin-bottom: 20px;
    }



  }
}
</style>
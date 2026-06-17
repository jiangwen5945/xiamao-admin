<template>
  <div class="page">
    <el-card class="box-card">
      <h3>基本信息</h3>
      <el-form
        :model="form"
        status-icon
        :rules="rules"
        ref="formRef"
        label-width="150px"
      >
        <el-form-item prop="头像" label="头像">

          <el-upload
            class="avatar-uploader"
            action="/api/uploadFiles"
            :show-file-list="false"
            accept=".png, .jepg, .jpg, .webp"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="form.avatar" :src="form.avatar" class="avatar" />
            <i v-else class="el-icon-plus avatar-uploader-icon"></i>
          </el-upload>
        </el-form-item>
        <el-form-item prop="nickName" label="昵称">
          <el-input
            v-model="form.nickName"
            prefix-icon="el-icon-postcard"
            style="width: 30%;"
          ></el-input>
        </el-form-item>
        <el-form-item prop="userName" label="用户名" >
          <el-input
            v-model="form.userName"
            prefix-icon="el-icon-user"
            style="width: 30%;"
            disabled
          ></el-input>
        </el-form-item>
        <el-form-item prop="role" label="角色" >
          <el-input
            v-model="form.role"
            prefix-icon="el-icon-s-check"
            style="width: 30%;"
            disabled
          ></el-input>
        </el-form-item>
        <el-form-item prop="password" label="密码">
          <el-input
            type="password"
            v-model="form.passWord"
            prefix-icon="el-icon-key"
            style="width: 30%;"
          ></el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            @click="handleSave()"
            :disabled="!isSubmit"
          >保存修改</el-button
          >
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>
 
<script>

import rules from "@/utils/rules";
export default {
  name: "member",
  
  created(){
    this.form = this.$store.state.tab.userInfo || JSON.parse(localStorage.getItem("userInfo"))
  },
  computed:{
    isSubmit() {
      return !!this.form.userName && !!this.form.passWord
    }
  },
  data() {
    return {
      rules,
      form: {
        avatar: '',
        nickName:'',
        userName: '',
        passWord: ''
      },
      
    };
  },
  methods: {
    handleAvatarSuccess(res, file) {
      // 上传成功后图片的存储地址 
      this.form.avatar = res.result.filesUrl
    },
    beforeAvatarUpload(file) {
      const isJPG = file.type === "image/jpeg";
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isLt2M) {
        this.$message.error("上传头像图片大小不能超过 2MB!");
      }
      return isLt2M;
    },
    async handleSave(){
      await this.$store.dispatch('changeUserInfo', this.form)
      this.$message.success('修改成功')
    }
  },
};
</script>
 
<style lang="scss" scoped>
.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 178px;

  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 178px;
    height: 178px;
    line-height: 178px;
    text-align: center;
  }

  .avatar {
    width: 178px;
    height: 178px;
    display: block;
  }
}
</style>
 
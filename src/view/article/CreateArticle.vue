<template>
  <div class="page">
    <el-form ref="form" :model="form" :rules="rules" label-width="80px">
      <!-- 文章标题 -->
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入文章标题"></el-input>
      </el-form-item>

      <!-- 文章标题 -->
      <el-form-item label="作者" prop="author">
        <el-input v-model="form.author" placeholder="请输入文章标题"></el-input>
      </el-form-item>

      <!-- 封页图片 -->
      <el-form-item label="封页图片" prop="fileList">
        <el-upload action="https://jsonplaceholder.typicode.com/posts/" list-type="picture-card"
          :file-list="form.fileList" :on-remove="handleRemove" :on-success="handleUploadSuccess"
          :before-upload="handleBeforUpload" ref="uploadRef">
          <i class="el-icon-plus"></i>
        </el-upload>
      </el-form-item>

       <!-- 是否上架 -->
       <el-form-item label="是否上架" prop="status">
        <el-switch v-model="form.status" :active-value="1" :inactive-value="0">
        </el-switch>
      </el-form-item>

      <!-- 内容 -->
      <el-form-item label="内容" prop="content">
        <quillEditor class="editor" @change="onEditorChange($event)" ref="quill" v-model="form.content"
          :options="editorOption" />
      </el-form-item>

      <el-form-item class="footer-wrapper">
        <el-button @click="save" :disabled="!isComplete">保存草稿</el-button>
        <el-button type="primary" @click="submit" :disabled="!isComplete">提交</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
 
<script>
import rules from "@/utils/rules";
import { quillEditor } from "vue-quill-editor";

// require styles
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import 'quill/dist/quill.bubble.css'
export default {
  name: 'CreateArticle',
  components: {
    quillEditor
  },
  created(){
    if(this.$route.query.id){
      this.currentType = 1
    }
    console.log(this.$route.query);
    this.form = Object.assign( this.form, this.$route.query)
  },
  data() {
    return {
      form: {
        status: 0,
        content: '',
        fileList: [], // 上传完成文件地址数组（编辑回显时需要）
      },
      isComplete: true, // 文件上传是否完成
      editorOption: {
        theme: "snow",
        placeholder: "请输入正文",
      },
      rules,
      currentType: 0
    };
  },
  methods: {
    // 上传文件之前
    handleBeforUpload() {
      this.isComplete = false
    },

    // 文件上传成功时
    handleUploadSuccess(res, file, fileList) {
      this.isComplete = true
      // this.form.fileList.push(file) // 添加到上传的文件列表
      this.form.fileList = JSON.parse(JSON.stringify(fileList))
      this.$refs.uploadRef.clearFiles() // 清空已上传的文件列表
    },

    // 文件列表移除文件时
    handleRemove(file, fileList) {
      this.form.fileList = JSON.parse(JSON.stringify(fileList))
    },

    onEditorChange() { },
    save() {
      console.log('保存草稿');
    },
    submit() {
      const cloneForm = JSON.parse(JSON.stringify(this.form))
      console.log('submit', cloneForm);
      this.$refs.form.validate(async valid => {
        // 当表单验证通过
        if (valid) {
          switch (this.currentType) {
            case 0:  // 新建
              await this.$api.createArticle(cloneForm)
              this.$refs.form.resetFields() // 表单进行重置
              this.$router.push({ path: 'ArticleList' })
              break;
            case 1:  // 编辑
              await this.$api.updateArticle(cloneForm)
              this.$refs.form.resetFields() // 表单进行重置
              this.$router.push({ path: 'ArticleList' })
              break;
          }
          this.$message({
            type: 'success',
            message: this.currentType === 0 ? '添加成功' : '编辑成功'
          });
        }
      })
    }


  }
}
</script>
 
<style scoped lang="scss">
.editor {
  line-height: normal !important;
  height: 350px;

  p {
    line-height: 1.5em;
  }
}

.footer-wrapper {
  button {
    width: 200px;
  }

  text-align: center;
  margin-top: 80px;
}
</style>
 
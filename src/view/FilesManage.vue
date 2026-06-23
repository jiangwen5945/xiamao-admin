<template>
  <div class="page">
    <el-tabs v-model="activeName" type="card" class="demo-tabs" @tab-click="handleTab">
      <el-tab-pane label="图片" name="first">
        <el-upload action="/api/uploadFiles" list-type="picture-card" :auto-upload="true"
          accept=".png, .jepg, .jpg, .webp" multiple :on-success="handleSuccess" :before-upload="beforeUpload"
          :file-list="imageList">
          <i slot="default" class="el-icon-plus"></i>
          <div slot="file" slot-scope="{file}">
            <img class="el-upload-list__item-thumbnail" :src="file.url" alt="">
            <span class="el-upload-list__item-actions">
              <span v-if="!disabled" class="el-upload-list__item-delete" @click="handleDownload(file)">
                <i class="el-icon-download"></i>
              </span>
              <span v-if="!disabled" class="el-upload-list__item-delete" @click="handleRemove(file)">
                <i class="el-icon-delete"></i>
              </span>
              <p class="img-title">{{ file.name }}</p>
            </span>
          </div>
        </el-upload>
      </el-tab-pane>

      <el-tab-pane label="音视频" name="second">
        <el-upload action="/api/uploadFiles" :file-list="videoList" list-type="picture">
          <el-button size="small" type="primary">点击上传</el-button>
          <div slot="tip" class="el-upload__tip">只能上传音视频格式的文件，且不超过500M</div>
        </el-upload>
      </el-tab-pane>

      <el-tab-pane label="文档" name="third">
        <el-upload :auto-upload="false" action="/api/importExcel" :file-list="documentList" accept=".xls,.xlsx">
          <el-button size="small" type="primary">点击上传</el-button>
          <div slot="tip" class="el-upload__tip">只能上传文档格式的文件，且不超过500kb</div>
        </el-upload>
      </el-tab-pane>

      <el-tab-pane label="压缩包" name="fourth">
        <el-upload drag action="/api/uploadFiles" :auto-upload="false" multiple :file-list="bigFileList"
          :on-change="handleChange">
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        </el-upload>
        <el-progress :percentage="percentage" v-show="percentage"></el-progress>

      </el-tab-pane>
    </el-tabs>
  </div>
</template>
 
<script>

export default {
  name: 'FilesManage',
  components: {},
  data() {
    return {
      activeName: 'fourth',
      imageUrl: '',
      disabled: false,
      percentage: 0,
      imageList: [
        { name: 'name', url: 'https://s2.loli.net/2023/03/10/gTv2kOE9iNHPs8V.jpg' }
      ],
      documentList: [
        { name: 'xxx_001.xlsl', url: 'xxxxxxx' },
        { name: 'xxx_002.xlsl', url: 'xxxxxxx' },
      ],
      videoList: [
        { name: 'xxx_001.mp4', url: 'https://s2.loli.net/2023/03/10/gTv2kOE9iNHPs8V.jpg' },
        { name: 'xxx_002.mp3', url: 'https://s2.loli.net/2023/03/10/gTv2kOE9iNHPs8V.jpg' },
      ],
      bigFileList: [
        { name: 'xxx_001.zip', url: 'xxxxxxx' },
      ]
    };
  },
  methods: {
    async handleChange(file, fileList) {
      console.log(file);
      let chunkSize = 2 * 1024 * 1024
      let fileSize = file.size
      // 待上传文件信息
      const fileInfo = {
        id: file.uid,
        name: file.name,
        totalChunks: Math.ceil(fileSize / chunkSize)
      }

      // 上传切片方法
      const chunkUpload = async (params) => {
        console.log('chunkUpload');
        let current = 0
        while (current < fileSize) {
          // 使用FormData传输文件流
          let _formData = new FormData()
          _formData.append(file.name, file.raw.slice(current, current + chunkSize))
          await this.$api.uploadFiles()
          current += chunkSize
          this.percentage = Math.min(Math.floor((current / fileSize) * 100), 100)
        }
        // 切片上传完成后
        this.percentage = 0 // 
        this.$message.success('上传完成')
      }      

      // 调用检测文件上传状态接口
      const fileStatus = await this.$api.checkChunkStatus({...fileInfo})
      console.log('调用检测文件上传状态接口', fileStatus);
      switch (fileStatus.status) {
        case 1: // 切片上传完毕但未完成合并
          console.log('1: 切片上传完毕但未完成合并');
          break;
        case 2: // 切片上传完毕且合并完成（秒传）
          console.log('2: 切片上传完毕且合并完成（秒传）');
          break;

        case 3: // 切片部分上传完毕（断点续传）
          console.log('3: 切片部分上传完毕（断点续传）');
          break;

        default: // 调用切片上传方法
          chunkUpload()
          break;
      }
    },
    // 切换类型
    handleTab(tab, event) {
      // console.log(tab, event)
    },
    // 上传成功
    handleSuccess(res, file) {
      console.log('上传成功', res, file);
      // this.imageUrl = URL.createObjectURL(file.raw);
    },
    // 上传前
    beforeUpload(file) {
      const isJPG = file.type === 'image/jpeg';
      const isPNG = file.type === 'image/png';
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isJPG && !isPNG) {
        this.$message.error('上传头像图片只能是 JPG 或 PNG 格式!');
      }
      if (!isLt2M) {
        this.$message.error('上传头像图片大小不能超过 2MB!');
      }
      return (isJPG || isPNG) && isLt2M;
    },
    // 预览
    handlePictureCardPreview(file) {
      this.dialogImageUrl = file.url;
      this.dialogVisible = true;
    },
    // 下载
    handleDownload(e) {
      console.log('下载', e);
    },
    // 移除
    handleRemove(e) {
      this.imageList.forEach((v, i) => {
        if (e.uid === v.uid) {
          this.imageList.splice(i, 1)
        }
      })
    },
  }
}
</script>
 
<style scoped lang="scss">
.img-title {
  font-size: 12px;
  position: absolute;
  bottom: 0;
  width: 100%;
  text-align: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
 
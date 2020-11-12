<template>
  <div>
      <h1>用户中心</h1>
      <i class="el-icon-loading"></i>
      <div ref='drag' id="drag">
        <input type="file" name="file" @change="handleChange">
      </div>
      <div>
        <el-progress
          :stroke-width='20'
          :text-inside='true'
          :percentage='uploadProgress'
        />
      </div>
      <el-button type="primary" @click="uploadFile">上传</el-button>
  </div>
</template>

<style lang="stylus">
#drag
  height 100px
  line-height 100px
  border 2px dashed #eee
  text-align center
</style>

<script>
export default {
  data () {
    return {
      file: null,
      uploadProgress: 0
    }
  },
  async mounted () {
    const ret = await this.$http.get('/user/info')
    this.bindEvent()
  },
  methods: {
    async handleChange (e) {
      const [file] = e.target.files
      if (!file) return
      this.file = file
    },
    async uploadFile () {
      if (!this.file) return
      if (!await this.isImage(this.file)) {
        this.$message.error('文件格式不对')
        return
      }
      // 转成formData格式上传文件
      const form = new FormData()
      form.append('name', 'file')
      form.append('file', this.file)
      const ret = await this.$http.post('/uploadFile', form, {
        onUploadProgress: progress => {
          this.uploadProgress = Number(((progress.loaded / progress.total) * 100).toFixed(2))
        }
      })
      if (ret.code === 0) {
        this.$message.success('上传成功')
      }
    },
    bindEvent () {
      const drag = this.$refs.drag
      drag.addEventListener('dragover', e => {
        drag.style.borderColor = 'red'
        e.preventDefault()
      })
      drag.addEventListener('dragleave', e => {
        drag.style.borderColor = '#eee'
        e.preventDefault()
      })
      drag.addEventListener('drop', e => {
        const fileList = e.dataTransfer.files
        drag.style.borderColor = '#eee'
        this.file = fileList[0]
        e.preventDefault()
      })
    },
    async isImage (file) {
      return await this.isGif(file) || await this.isJpg(file) || await this.isPng(file)
    },
    async blobToString(blob){
      return new Promise(resolve=>{
        const reader = new FileReader()
        reader.onload = function(){
          const ret = reader.result.split('')
                        .map(v=>v.charCodeAt())
                        .map(v=>v.toString(16).toUpperCase())
                        // .map(v=>v.padStart(2,'0'))
                        .join('')
          resolve(ret)
          // const ret = reader.
        }
        reader.readAsBinaryString(blob)
      })
    },
    async isGif(file){
      // GIF89a 和GIF87a
      // 前面6个16进制，'47 49 46 38 39 61' '47 49 46 38 37 61'
      // 16进制的抓安环
      const ret = await this.blobToString(file.slice(0,6))
      console.log(ret, 'gif')
      const isgif = (ret=='474946383961') || (ret=='474946383761')
      return isgif
    },
    async isPng(file){
      const ret = await this.blobToString(file.slice(0,8))
      const ispng = (ret == "89504E47DA1AA")
      return ispng
    },
    async isJpg(file){
      const len = file.size
      const start = await this.blobToString(file.slice(0,2))
      const tail = await this.blobToString(file.slice(-2,len))
      const isjpg = (start=='FFD8') && (tail=='FFD9')
      return isjpg
    },
  }
}
</script>

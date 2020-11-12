<template>
  <div>
      <h1>用户中心</h1>
      <i class="el-icon-loading"></i>
      <input type="file" name="file" @change="handleChange">
      <el-button type="primary" @click="uploadFile">上传</el-button>
  </div>
</template>

<script>
export default {
  data () {
    return {
      file: null
    }
  },
  async mounted () {
    const ret = await this.$http.get('/user/info')
    console.log(ret, 12)
  },
  methods: {
    async handleChange (e) {
      const [file] = e.target.files
      if (!file) return
      this.file = file
    },
    async uploadFile () {
      if (!this.file) return
      // 转成formData格式上传文件
      const form = new FormData()
      form.append('name', 'file')
      form.append('file', this.file)
      console.log(this.file, 77)
      const ret = await this.$http.post('/uploadFile', form)
      if (ret.code === 0) {
        this.$message.success('上传成功')
      }
    }
  }
}
</script>

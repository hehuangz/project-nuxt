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
      <div>
        <p>切片进度</p>
        <el-progress
          :stroke-width='20'
          :text-inside='true'
          :percentage='hashProgress'
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
import sparkMD5 from 'spark-md5'
const CHUNK_SIZE = 0.1 * 1024 * 1024 // 单个切片大小0.5M
export default {
  data () {
    return {
      file: null,
      uploadProgress: 0,
      hashProgress: 0
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
    // 将大文件变成n个小文件，塞进数组里
    createFileChunk (file, size = CHUNK_SIZE) {
      let cur = 0
      let chunks = []
      while(cur < this.file.size) {
        chunks.push({index: cur, file: this.file.slice(cur, cur + size)})
        cur+=size
      }
      return chunks
    },
    async calculateHashWorker (chunks) {
      return new Promise(resolve => {
        this.worker = new Worker('/hash.js')
        this.worker.postMessage({chunks: this.chunks})
        this.worker.onmessage = e => {
          const { progress, hash } = e.data
          this.hashProgress = Number(progress.toFixed(2))
          if (hash) {
            resolve(hash)
          }
         }
      })
    },
    async calculateHashIdle () {
      const chunks = this.chunks
      return new Promise(resolve => {
        const spark = new sparkMD5.ArrayBuffer()
        let count = 0
        const appendToSpark = async file => {
          return new Promise(resolve2 => {
            const reader = new FileReader()
            reader.readAsArrayBuffer(file)
            reader.onload = e => {
              spark.append(e.target.result)
              resolve2()
            }
          })
        }

        const workLoop = async deadline => {
          // timeRemaining 获取当前帧的空余时间
          while(count < chunks.length && deadline.timeRemaining() > 1 ){
            // 空闲时间且有任务
            await appendToSpark(chunks[count].file)
            count++
            if (count < chunks.length) {
              this.hashProgress = Number(
                ((100 * count) / chunks.length).toFixed(2)
              )
            } else {
              this.hashProgress = 100
              resolve(spark.end())
            }
          }
          window.requestIdleCallback(workLoop)
        }

        // 浏览器一旦空闲，就会调用workLoop
        window.requestIdleCallback(workLoop)
      })
    },
    async uploadFile () {
      if (!this.file) return

      // 文件上传，不校验图片格式
      // if (!await this.isImage(this.file)) {
      //   this.$message.error('文件格式不对')
      //   return
      // }

      // 得到切片后的文件流数组
      this.chunks = this.createFileChunk(this.file)
      // 计算hash值,文件大会卡，解决办法一：webWorker，方法二，利用空闲时间计算
      // 方法一：
      // const hash = await this.calculateHashWorker()
      // 方法二：
      const hash2 = await this.calculateHashIdle()
      return

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

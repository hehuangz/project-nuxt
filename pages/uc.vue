<template>
  <div>
      <h1>用户中心</h1>
      <i class="el-icon-loading"></i>
  </div>
</template>

<script>
export default {
  async mounted () {
    const ret = await this.$http.get('/user/info')
    console.log(ret, 12)
  }
}
</script>

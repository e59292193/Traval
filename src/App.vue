<script setup lang="ts">
import {onLaunch} from '@dcloudio/uni-app'
onLaunch(()=>{ /* No analytics or remote photo processing. */ })
</script>
<style>
/* Custom navigation: disable unused framework shadow preloading in dev too. */
body::after{content:none!important;animation:none!important;background-image:none!important}
page{background:#f5f3ed;color:#343c36;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;font-size:16px;line-height:1.5}*{box-sizing:border-box}button{font:inherit;margin:0;border-radius:8px;cursor:pointer}button::after{border:0}button:focus-visible,input:focus-visible{outline:3px solid #ad673c;outline-offset:3px}button[disabled]{opacity:.5;cursor:not-allowed}input{font:inherit}view,text{box-sizing:border-box}
</style>

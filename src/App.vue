<script setup lang="ts">
import {onLaunch} from '@dcloudio/uni-app'
onLaunch(()=>{ /* No analytics or remote photo processing. */ })
</script>
<style>
/* Custom navigation: disable unused framework shadow preloading in dev too. */
body::after{content:none!important;animation:none!important;background-image:none!important}
page{background:#f5f3ed;color:#343c36;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;font-size:16px;line-height:1.5}*{box-sizing:border-box}button{font:inherit;margin:0;border-radius:8px;cursor:pointer}button::after{border:0}button:focus-visible,input:focus-visible{outline:3px solid #ad673c;outline-offset:3px}button[disabled]{opacity:.5;cursor:not-allowed}input{font:inherit}view,text{box-sizing:border-box}
/* Framework button defaults must not collapse MapLibre native controls. */
.maplibregl-ctrl-group{box-shadow:0 0 0 1px #c3ccbd;border-radius:6px;overflow:hidden}
.maplibregl-ctrl-group [type="button"]{display:block;width:44px;height:44px;min-width:44px;min-height:44px;padding:0;margin:0;border:0;border-radius:0;line-height:normal;background-color:#fff;color:#39473d}
.maplibregl-ctrl-group [type="button"]+button{border-top:1px solid #dfe2d4}
.maplibregl-ctrl-icon{display:block;width:100%;height:100%}
.maplibregl-ctrl-zoom-in .maplibregl-ctrl-icon{background:transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 5v14M5 12h14' fill='none' stroke='%2339473d' stroke-width='2'/%3E%3C/svg%3E") center/22px 22px no-repeat}
.maplibregl-ctrl-zoom-out .maplibregl-ctrl-icon{background:transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M5 12h14' fill='none' stroke='%2339473d' stroke-width='2'/%3E%3C/svg%3E") center/22px 22px no-repeat}
.maplibregl-ctrl-attrib{font-size:11px;line-height:18px;white-space:normal;max-width:calc(100vw - 80px)}
.maplibregl-ctrl-attrib [href]{color:#314b40}
</style>

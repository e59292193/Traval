import { defineConfig, type Plugin } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
// uni H5 preloads an unused remote navigation-shadow PNG after 3 seconds.
// This app uses custom navigation. Remove those known framework URLs from CSS,
// without modifying node_modules or substituting unlicensed image assets.
const localShadows:Plugin={
 name:'traval-local-navigation-shadows',enforce:'post',
 generateBundle(_options,bundle){
  for(const asset of Object.values(bundle)){
   if(asset.type==='asset'&&asset.fileName.endsWith('.css')&&typeof asset.source==='string')
    asset.source=asset.source.replace(/url\([^)]*https:\/\/cdn\.dcloud\.net\.cn\/img\/shadow-[^)]*\)/g,'none')
  }
 }
}
export default defineConfig({plugins:[uni(),localShadows],server:{host:'0.0.0.0'},build:{sourcemap:false}})

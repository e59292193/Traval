> V0.4.1 已补齐地区填色、修复异步连线/导出缓存并统一“台湾省”标注。以下“不填色”为 V0.4 旧行为，当前请看 [修复说明](FIXES-V0.4.1.md)。

# V0.4 · 精细旅行地图

## 使用

1. 在“旅行足迹”新建一次旅行。
2. 搜索预设城市，或点“地图选点”后填写名称与所属地区。也可手动输入 **WGS84** 经纬度。
3. 添加日期、札记和本地照片关联；地点按列表顺序连线。地图支持拖动、缩放、聚合展开、点击足迹查看记录。
4. “查看旅行”适配当前所选旅行；“全国概览”只改变交互地图视图。
5. “海报地图范围”决定成品为当前旅行范围或全国概览；并非交互地图当前拖动视口截图。
6. 开启“足迹地图合成到海报”可导出精细地图。地图加载失败时需明确确认才能导出静态回退；静态回退不含精细路线。
7. **手动保存本地草稿**。不自动保存、不跨设备同步。

## 本版实现

- MapLibre GL JS 6.15.0（WebGL2），H5 专用。Worker 由 Vite 输出同源文件，不依赖 unpkg。
- 本地 Positron 样式配置，远程 OpenFreeMap 矢量瓦片、sprite、字体，中文名称优先并使用系统中文字体。无需 API Key，但不代表离线可用或服务有 SLA。
- 道路、水系、城市与街区等细节由底图覆盖范围和缩放级别决定，不承诺每个乡镇/道路都有完整数据。
- 各次旅行分开连线，不跨旅行连接。连线为地点顺序的直线，不是道路导航/真实轨迹。
- 聚合仅用于视觉去重；相同地点多次到访仍保留在时间线中。统计基于全部旅行，地图根据所选旅行过滤。
- 省级地区手动标记保留在列表与统计中，本版不在精细底图填色。
- 精细地图导出采用离屏固定尺寸 WebGL 渲染、等待 idle/瓦片、Canvas 读回检测、海报合成，并保留地图/样式署名。
- 导出范围无有效地点时用全国；单点以城市级视图展示。照片地图贴片在精细模式收起，下方照片区保留。

## 坐标和旧数据

新地点目录 `src/data/places-wgs84.json` 使用 GeoNames `cities15000.zip`，本次匹配 317 个预设地点。以旧地点中文名称（允许“市”后缀）精确匹配 GeoNames 备用名，并取距旧中心 50km 内的最近候选。保留旧 ID 和地区标签只是为了应用内对应；**不是把旧坐标转换为 WGS84，也不是测绘精度核验**。未匹配的 53 个旧预设没有捏造新坐标，仍可手动选点记录。来源 ID 记在每条 `source` 中，如 `geonames:1816670`。匹配报告见 `evidence/v4/coordinate-catalog.json`。

GeoNames：https://www.geonames.org/ ，数据说明：https://download.geonames.org/export/dump/readme.txt 。WGS84，CC BY 4.0，数据按原样提供。该目录是开发时下载的数据快照，不会运行时自动更新。

- journal v1 → v2：保留旅行、札记、日期、照片和原坐标；未声明坐标系的旧地点标为 `datav-native`，显示“旧坐标待核验”。
- 待核验地点不进入精细地图，连线不越过这些点。统计仍保留它们。
- 同 ID 预设可在时间线点“更新坐标”，确认后采用 GeoNames 新坐标，并保留 `originalCoord`。这是替换来源，不是数学转换。
- 旧自定义地点仅改札记不会自动改标坐标；采用新地点需要明确确认。
- 自定义坐标由用户保证为 WGS84。不支持自动识别/转换 GCJ-02、BD-09；不读取 GPS 或照片定位，不做在线地点检索/逆地理编码。所属地区手动指定。

## 隐私、网络与失败处理

- 远程请求限定于底图服务 `tiles.openfreemap.org`（瓦片、字体、sprite），会暴露 IP、请求时间、可反映浏览范围的瓦片编号；不能再宣称完全无外部请求。
- 不向底图服务发送照片文件、旅行标题、札记、日期或自定义地点名称；旅行 GeoJSON 在本机传给 MapLibre。没有统计 SDK 或运行时 AI 服务。
- 网络错误/WebGL 不可用显示提示并提供重试；记录编辑和静态手账不依赖瓦片。已打开应用断网不等于整个应用支持离线冷启动。
- 海报精细地图失败会要求确认静态回退，不静默声称精细导出成功。

## 数据与设计署名

- MapLibre GL JS：BSD 3-Clause，`licenses/MapLibre-LICENSE.txt`。
- OpenFreeMap：https://openfreemap.org/ ，https://github.com/hyperknot/openfreemap ，许可组合见 `licenses/OpenFreeMap-LICENSE.md`。
- 地图数据：OpenStreetMap contributors（ODbL），https://www.openstreetmap.org/copyright 。OpenMapTiles 数据设计署名按其 CC BY 要求保留。
- Positron / OpenMapTiles 样式，源自 CARTO Basemaps（Stamen、Paul Norman / CartoDB）；本版改动纸色、水色、标签语言。代码 BSD、设计 CC BY 等见 `licenses/Positron-LICENSE.md`。
- GeoNames 坐标：https://www.geonames.org/ ，CC BY 4.0，https://creativecommons.org/licenses/by/4.0/ 。

## 仍未完成/不代表通过

- 中国地图内容、边界、数据许可履行、审图及公开商业发布要求需要单独核实；静态图审图号不迁移到精细地图。
- OpenFreeMap 无付费服务接入/无 API Key，但中国大陆可达性、浏览器 WebGL2、字体与手机性能要实测。
- 小程序保留静态手账与构建，不包含本次 H5 MapLibre 交互；未做真机验收。
- 无在线导航、地址搜索、自动路线规划、账号/云同步、地图服务 SLA 或用户授权位置功能。
- 原有依赖审计高风险项仍然存在，本版不作为商业发布通过证明。

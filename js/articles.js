/* ============================================================
   WWSTA 个人主页 —— 文章与讨论（人工维护）
   发布在 EasyTier 社区（GitHub Discussions）的内容。
   新增文章时在本数组追加一条即可：
     { title, type, source, date, summary, url }
   ============================================================ */

window.SNAPSHOT_ARTICLES = [
  {
    title: "【教程】Cloudflare Tunnel 自建 EasyTier 共享节点（无Docker，自定义域名 wss:// 接入，客户端自建虚拟局域网，再也不怕公益服务器掉线）",
    type: "教程",
    source: "EasyTier Discussions #2512",
    date: null,
    summary: "无公网 IP 的家庭电脑通过 Cloudflare Tunnel 绑定自有域名对外提供 wss:// 加密接入，自建 EasyTier 共享节点：客户端自建隔离虚拟局域网、零公网入站端口，附完整部署步骤与排障速查。",
    url: "https://github.com/EasyTier/EasyTier/discussions/2512"
  },
  {
    title: "分享一个使用 Cloudflare Workers 自建节点和 easytier-cf-relay 项目",
    type: "项目分享",
    source: "EasyTier Discussions #2530",
    date: "2026 年 8 月 27 日",
    summary: "介绍 easytier-cf-relay：在 Cloudflare Workers 免费额度内部署 EasyTier WebSocket 中转节点（全 Hibernation + 限流设计），并与官方 WASM 子项目在免费额度与协议兼容上的取舍对比。",
    url: "https://github.com/EasyTier/EasyTier/discussions/2530"
  }
];
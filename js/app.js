/* ============================================================
   WWSTA 个人主页 —— 渲染与数据逻辑
   策略：默认静态 —— 首屏完全由 js/data.js 快照渲染（含全部
   GitHub 直链），离线可用；页面加载后尝试请求 GitHub API，
   仅当可访问时才把数据更新为最新；失败（离线 / 被墙 / 限流）
   则静默保留静态内容。所有链接保持官方直连，不做镜像改写。
   ============================================================ */

(function () {
  "use strict";

  var GITHUB_USER = "WWSTA";
  var HOT_LIMIT = 6; // 「热门项目」展示的仓库数

  var state = {
    user: (window.SNAPSHOT && SNAPSHOT.user) || null,
    repos: (window.SNAPSHOT && SNAPSHOT.repos) || [],
    articles: (window.SNAPSHOT && SNAPSHOT.articles) || window.SNAPSHOT_ARTICLES || [],
    tab: "hot" // hot | mine | forks
  };

  /* ---------------- 图标（GitHub Octicons，MIT License） ---------------- */

  var ICON_PATHS = {
    repo: '<path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path>',
    star: '<path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z"></path>',
    starFill: '<path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path>',
    fork: '<path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path>',
    people: '<path d="M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4 4 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 3.102 8.05 3.493 3.493 0 0 1 2 5.5ZM11 4a3.001 3.001 0 0 1 2.22 5.018 5.01 5.01 0 0 1 2.56 3.012.749.749 0 0 1-.885.954.752.752 0 0 1-.549-.514 3.507 3.507 0 0 0-2.522-2.372.75.75 0 0 1-.578-.73v-.353a.75.75 0 0 1 .432-.678A1.5 1.5 0 0 0 11 5.5.75.75 0 0 1 11 4Zm-5.5-.5a2 2 0 1 0-.001 3.999A2 2 0 0 0 5.5 3.5Z"></path>',
    clock: '<path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z"></path>',
    check: '<path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>',
    comment: '<path d="M1.75 1h8.5c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 10.25 10H7.061l-2.574 2.573A1.458 1.458 0 0 1 2 11.543V10h-.25A1.75 1.75 0 0 1 0 8.25v-5.5C0 1.784.784 1 1.75 1ZM1.5 2.75v5.5c0 .138.112.25.25.25h1a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h3.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25Zm13-2a.25.25 0 0 0-.25-.25H4.75a.75.75 0 0 1 0-1.5h9.5c.966 0 1.75.784 1.75 1.75v5.5a1.75 1.75 0 0 1-1.5 1.732v-6.482Z"></path>',
    globe: '<path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM5.78 8.75a9.64 9.64 0 0 0 1.363 4.177c.255.426.542.832.857 1.215.245-.296.551-.705.857-1.215A9.64 9.64 0 0 0 10.22 8.75Zm4.44-1.5a9.64 9.64 0 0 0-1.363-4.177c-.307-.51-.612-.919-.857-1.215a9.927 9.927 0 0 0-.857 1.215A9.64 9.64 0 0 0 5.78 7.25Zm-5.944 1.5H1.543a6.507 6.507 0 0 0 4.666 5.5c-.123-.181-.24-.365-.352-.552-.715-1.192-1.437-2.874-1.581-4.948Zm-2.733-1.5h2.733c.144-2.074.866-3.756 1.58-4.948.12-.197.237-.381.353-.552a6.507 6.507 0 0 0-4.666 5.5Zm10.181 1.5c-.144 2.074-.866 3.756-1.58 4.948-.12.197-.237.381-.353.552a6.507 6.507 0 0 0 4.666-5.5Zm2.733-1.5a6.507 6.507 0 0 0-4.666-5.5c.123.181.24.365.353.552.714 1.192 1.436 2.874 1.58 4.948Z"></path>'
  };

  function icon(name) {
    return (
      '<svg class="octicon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">' +
      ICON_PATHS[name] +
      "</svg>"
    );
  }

  /* ---------------- 工具函数 ---------------- */

  var LANG_COLORS = {
    HTML: "#e34c26",
    CSS: "#663399",
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    Python: "#3572A5",
    Java: "#b07219",
    Kotlin: "#A97BFF",
    "C++": "#f34b7d",
    C: "#555555",
    "C#": "#178600",
    Go: "#00ADD8",
    Rust: "#dea584",
    Vue: "#41b883",
    Shell: "#89e051",
    Dockerfile: "#384d54",
    Lua: "#000080",
    PowerShell: "#012456",
    其他: "#6e7781"
  };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function timeAgo(iso) {
    var t = new Date(iso);
    if (isNaN(t.getTime())) return "";
    var diff = (Date.now() - t.getTime()) / 1000;
    if (diff < 60) return "刚刚";
    var m = diff / 60;
    if (m < 60) return Math.floor(m) + " 分钟前";
    var h = m / 60;
    if (h < 24) return Math.floor(h) + " 小时前";
    var d = h / 24;
    if (d < 30) return Math.floor(d) + " 天前";
    var mo = d / 30;
    if (mo < 12) return Math.floor(mo) + " 个月前";
    return Math.floor(mo / 12) + " 年前";
  }

  function joinedAt(iso) {
    var t = new Date(iso);
    if (isNaN(t.getTime())) return "";
    return t.getFullYear() + " 年 " + (t.getMonth() + 1) + " 月加入";
  }

  /* ---------------- 项目分类 ---------------- */

  function byHot(a, b) {
    return (
      b.stargazers - a.stargazers ||
      b.forks - a.forks ||
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  function byUpdated(a, b) {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  }

  function categorize(repos) {
    var mine = [];
    var forks = [];
    repos.forEach(function (r) {
      (r.fork ? forks : mine).push(r);
    });
    return {
      hot: mine.slice().sort(byHot).slice(0, HOT_LIMIT),
      mine: mine.slice().sort(byUpdated),
      forks: forks.slice().sort(byUpdated)
    };
  }

  /* ---------------- Hero：概要信息 + 打字机 ---------------- */

  function renderHero() {
    var el = document.getElementById("hero-meta");
    if (!el || !state.user) return;
    var u = state.user;
    el.innerHTML =
      '<span class="meta-item">' + icon("people") +
      '<a href="' + esc(u.htmlUrl) + '?tab=followers" target="_blank" rel="noopener">' + u.followers + "</a> followers" +
      " · " +
      '<a href="' + esc(u.htmlUrl) + '?tab=following" target="_blank" rel="noopener">' + u.following + "</a> following</span>" +
      '<span class="meta-item">' + icon("repo") +
      '<a href="' + esc(u.htmlUrl) + '?tab=repositories" target="_blank" rel="noopener">' + u.publicRepos + "</a> 个公开仓库</span>" +
      '<span class="meta-item">' + icon("clock") + joinedAt(u.createdAt) + "</span>";

    var follow = document.getElementById("follow-btn");
    if (follow) follow.setAttribute("href", u.htmlUrl);
  }

  function startTyping() {
    var el = document.getElementById("typing-text");
    if (!el) return;
    var phrases = [
      "你好，我是 WWSTA 👋",
      "欢迎来到我的个人主页",
      "爱折腾代码、工具与网络",
      "开源让世界更美好 ✨"
    ];
    var pi = 0;
    var ci = 0;
    var erasing = false;

    function tick() {
      var text = phrases[pi];
      if (!erasing) {
        ci++;
        el.textContent = text.slice(0, ci);
        if (ci >= text.length) {
          erasing = true;
          setTimeout(tick, 1800); // 打完整句停顿
          return;
        }
        setTimeout(tick, 90);
      } else {
        ci--;
        el.textContent = text.slice(0, ci);
        if (ci <= 0) {
          erasing = false;
          pi = (pi + 1) % phrases.length;
          setTimeout(tick, 400);
          return;
        }
        setTimeout(tick, 40);
      }
    }
    tick();
  }

  /* ---------------- 数据统计卡片 ---------------- */

  function renderStats(cats) {
    var grid = document.getElementById("stats-grid");
    if (!grid) return;

    var totalStars = 0;
    var totalForks = 0;
    state.repos.forEach(function (r) {
      totalStars += r.stargazers || 0;
      totalForks += r.forks || 0;
    });

    var mine = cats.mine;
    var top = mine.length ? mine.slice().sort(byHot)[0] : null;

    var cards = [
      '<div class="stat-card">' +
        '<div class="stat-head">' + icon("repo") + "<span>公开仓库</span></div>" +
        '<div class="stat-value">' + (state.user ? state.user.publicRepos : mine.length) + "</div>" +
        '<div class="stat-sub">原创 ' + mine.length + " · 克隆 " + cats.forks.length + "</div>" +
      "</div>",
      '<div class="stat-card">' +
        '<div class="stat-head">' + icon("star") + "<span>累计获得 Star</span></div>" +
        '<div class="stat-value">' + totalStars + "</div>" +
        '<div class="stat-sub">全部仓库合计</div>' +
      "</div>",
      '<div class="stat-card">' +
        '<div class="stat-head">' + icon("fork") + "<span>累计被 Fork</span></div>" +
        '<div class="stat-value">' + totalForks + "</div>" +
        '<div class="stat-sub">全部仓库合计</div>' +
      "</div>"
    ];

    if (top) {
      cards.push(
        '<div class="stat-card">' +
          '<div class="stat-head">' + icon("starFill") + "<span>最受欢迎项目</span></div>" +
          '<a class="stat-value is-link" href="' + esc(top.htmlUrl) + '" target="_blank" rel="noopener">' +
            esc(top.name) + "</a>" +
          '<div class="stat-sub">' + top.stargazers + " ★ · " + top.forks + " forks</div>" +
        "</div>"
      );
    }

    grid.innerHTML = cards.join("");
  }

  /* ---------------- 语言分布（原创仓库） ---------------- */

  function renderLangs(cats) {
    var bar = document.getElementById("lang-bar");
    var legend = document.getElementById("lang-legend");
    if (!bar || !legend) return;

    var counts = {};
    var total = 0;
    cats.mine.forEach(function (r) {
      var name = r.language || "其他";
      counts[name] = (counts[name] || 0) + 1;
      total++;
    });
    if (!total) {
      bar.hidden = true;
      return;
    }

    var entries = Object.keys(counts)
      .map(function (k) { return { name: k, count: counts[k] }; })
      .sort(function (a, b) { return b.count - a.count; });

    bar.innerHTML = entries
      .map(function (e) {
        var pct = (e.count / total) * 100;
        return (
          '<span class="lang-seg" style="width:' + pct + "%;background:" +
          (LANG_COLORS[e.name] || "#6e7781") + '" title="' + esc(e.name) + " " + pct.toFixed(1) + '%"></span>'
        );
      })
      .join("");

    legend.innerHTML = entries
      .map(function (e) {
        var pct = Math.round((e.count / total) * 100);
        return (
          "<li>" +
          '<span class="lang-dot" style="background:' + (LANG_COLORS[e.name] || "#6e7781") + '"></span>' +
          "<span>" + esc(e.name) + "</span>" +
          '<span class="lang-pct">' + pct + "%</span>" +
          "<span>" + e.count + " 个仓库</span>" +
          "</li>"
        );
      })
      .join("");
  }

  /* ---------------- 文章 ---------------- */

  function renderArticles() {
    var wrap = document.getElementById("article-list");
    if (!wrap) return;

    if (!state.articles.length) {
      wrap.innerHTML = '<p class="article-desc">这里还没有内容。</p>';
      return;
    }

    wrap.innerHTML = state.articles
      .map(function (a) {
        return (
          '<article class="article-item">' +
          '<div class="article-title-row">' +
          '<h3 class="article-title"><a href="' + esc(a.url) + '" target="_blank" rel="noopener">' +
          esc(a.title) + "</a></h3>" +
          '<span class="repo-badge">' + esc(a.type) + "</span>" +
          "</div>" +
          '<p class="article-desc">' + esc(a.summary) + "</p>" +
          '<div class="repo-meta">' +
          '<span class="meta-item">' + icon("comment") + esc(a.source) + "</span>" +
          (a.date ? '<span class="meta-item">' + icon("clock") + esc(a.date) + "</span>" : "") +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  /* ---------------- 项目列表 ---------------- */

  function metaHtml(r, withUpdated) {
    var parts = [];
    if (r.language) {
      parts.push(
        '<span class="lang"><span class="lang-dot" style="background:' +
          (LANG_COLORS[r.language] || "#6e7781") +
          '"></span>' +
          esc(r.language) +
          "</span>"
      );
    }
    /* 体验地址（仓库 About 中设置的 homepage，随每日快照自动同步） */
    if (r.homepage) {
      parts.push(
        '<a class="meta-item" href="' + esc(r.homepage) + '" target="_blank" rel="noopener" title="' +
          esc(r.homepage) + '">' + icon("globe") + " 体验地址</a>"
      );
    }
    parts.push(
      '<a class="meta-item" href="' + esc(r.htmlUrl) + '/stargazers" target="_blank" rel="noopener" title="Star 数">' +
        icon("star") + " " + r.stargazers + "</a>"
    );
    parts.push(
      '<a class="meta-item" href="' + esc(r.htmlUrl) + '/forks" target="_blank" rel="noopener" title="Fork 数">' +
        icon("fork") + " " + r.forks + "</a>"
    );
    if (withUpdated && r.updatedAt) {
      parts.push('<span class="meta-item">更新于 ' + timeAgo(r.updatedAt) + "</span>");
    }
    return '<div class="repo-meta">' + parts.join("") + "</div>";
  }

  function renderTabs(cats) {
    document.getElementById("count-hot").textContent = cats.hot.length;
    document.getElementById("count-mine").textContent = cats.mine.length;
    document.getElementById("count-forks").textContent = cats.forks.length;
  }

  function renderHot(cats) {
    var cards = cats.hot.map(function (r) {
      return (
        '<article class="pinned-card">' +
        '<div class="pinned-title">' + icon("repo") +
        '<a href="' + esc(r.htmlUrl) + '" target="_blank" rel="noopener">' + esc(r.name) + "</a></div>" +
        '<p class="pinned-desc">' + (r.description ? esc(r.description) : "暂无描述") + "</p>" +
        metaHtml(r, false) +
        "</article>"
      );
    });
    return '<div class="pinned-grid">' + cards.join("") + "</div>";
  }

  function renderList(repos, badgeText) {
    var items = repos.map(function (r) {
      return (
        '<article class="repo-item">' +
        '<div class="repo-item-body">' +
        '<h3 class="repo-title"><a href="' + esc(r.htmlUrl) + '" target="_blank" rel="noopener">' +
        esc(r.name) + "</a>" +
        (badgeText ? '<span class="repo-badge">' + badgeText + "</span>" : "") +
        "</h3>" +
        '<p class="repo-desc">' + (r.description ? esc(r.description) : "暂无描述") + "</p>" +
        metaHtml(r, true) +
        "</div></article>"
      );
    });
    return items.length
      ? '<div class="repo-list">' + items.join("") + "</div>"
      : '<p class="repo-desc">这里还没有内容。</p>';
  }

  function renderRepos(cats) {
    var area = document.getElementById("repo-area");
    if (state.tab === "hot") area.innerHTML = renderHot(cats);
    else if (state.tab === "mine") area.innerHTML = renderList(cats.mine, "Public");
    else area.innerHTML = renderList(cats.forks, "Forked");
  }

  function renderAll() {
    var cats = categorize(state.repos);
    renderHero();
    renderStats(cats);
    renderLangs(cats);
    renderArticles();
    renderTabs(cats);
    renderRepos(cats);
  }

  /* ---------------- Tab 切换 ---------------- */

  function bindTabs() {
    var tabs = document.querySelectorAll(".tab");
    tabs.forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.tab = btn.getAttribute("data-tab");
        tabs.forEach(function (b) {
          var sel = b === btn;
          b.classList.toggle("is-selected", sel);
          b.setAttribute("aria-selected", sel ? "true" : "false");
        });
        renderRepos(categorize(state.repos));
      });
    });
  }

  /* ---------------- 外链资源降级 ---------------- */

  function bindFallbacks() {
    // skillicons.dev 图标：加载失败降级为文字徽章
    var skillsImg = document.getElementById("skills-img");
    var skillsWrap = document.getElementById("skills-wrap");
    if (skillsImg && skillsWrap) {
      skillsImg.onerror = function () {
        var names = ["JavaScript", "HTML", "CSS", "Python", "Kotlin"];
        skillsWrap.innerHTML =
          '<div class="skill-chips">' +
          names
            .map(function (n) {
              return '<span class="skill-chip">' +
                '<span class="lang-dot" style="background:' + (LANG_COLORS[n] || "#6e7781") + '"></span>' +
                n + "</span>";
            })
            .join("") +
          "</div>";
      };
    }

    // 提交记录动画：尚未生成或无法访问时整节隐藏（说明见 README）
    var snakeImg = document.getElementById("snake-img");
    var snakeSection = document.getElementById("snake-section");
    if (snakeImg && snakeSection) {
      snakeImg.onerror = function () {
        snakeSection.hidden = true;
      };
    }
  }

  /* ---------------- GitHub API 动态刷新：可访问才更新，否则保留静态 ---------------- */

  function normalizeUser(u) {
    return {
      login: u.login,
      name: u.name || null,
      avatarUrl: u.avatar_url,
      bio: u.bio || null,
      followers: u.followers || 0,
      following: u.following || 0,
      publicRepos: u.public_repos || 0,
      createdAt: u.created_at,
      htmlUrl: u.html_url
    };
  }

  function normalizeRepo(r) {
    return {
      name: r.name,
      description: r.description || null,
      fork: !!r.fork,
      stargazers: r.stargazers_count || 0,
      forks: r.forks_count || 0,
      language: r.language || null,
      htmlUrl: r.html_url,
      homepage: r.homepage || null,
      updatedAt: r.updated_at
    };
  }

  function fetchLive() {
    var userUrl = "https://api.github.com/users/" + GITHUB_USER;
    var reposUrl = userUrl + "/repos?per_page=100&sort=updated";

    Promise.all([
      fetch(userUrl).then(function (r) { return r.ok ? r.json() : null; }),
      fetch(reposUrl).then(function (r) { return r.ok ? r.json() : null; })
    ])
      .then(function (res) {
        var u = res[0];
        var rs = res[1];
        /* 仅当 API 可访问且有数据时才更新；否则保留静态快照 */
        if (u) state.user = normalizeUser(u);
        if (rs && rs.length) state.repos = rs.map(normalizeRepo);
        if (!u && !(rs && rs.length)) return;
        renderAll();
        var status = document.getElementById("update-status");
        var now = new Date();
        var hh = ("0" + now.getHours()).slice(-2);
        var mm = ("0" + now.getMinutes()).slice(-2);
        status.innerHTML =
          icon("check") + " 数据已于 " + hh + ":" + mm + " 从 GitHub API 刷新为最新";
        status.hidden = false;
      })
      .catch(function () {
        /* 离线、被墙或限流（60 次/小时/IP）：静默保留静态快照 */
      });
  }

  /* ---------------- 主题切换（亮 / 暗） ---------------- */

  var THEME_KEY = "theme";
  var SNAKE_SRC_LIGHT =
    "https://raw.githubusercontent.com/WWSTA/wwsta.github.io/output/github_contribution_grid_snake.svg";
  var SNAKE_SRC_DARK =
    "https://raw.githubusercontent.com/WWSTA/wwsta.github.io/output/github_contribution_grid_snake_dark.svg";
  var SKILLS_SRC_BASE = "https://skillicons.dev/icons?i=js,html,css,py,kotlin&theme=";

  var THEME_ICONS = {
    /* 自绘太阳（当前为暗色时显示，点击切到亮色） */
    sun: '<svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M8 1v1.4M8 13.6V15M1 8h1.4M13.6 8H15M3.05 3.05l1 1M11.95 11.95l1 1M12.95 3.05l-1 1M4.05 11.95l-1 1"/></svg>',
    /* 自绘月亮（当前为亮色时显示，点击切到暗色） */
    moon: '<svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M13.3 9.9A6.1 6.1 0 0 1 6.1 2.7 6.1 6.1 0 1 0 13.3 9.9Z"/></svg>'
  };

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function updateThemeButton(t) {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.innerHTML = t === "dark" ? THEME_ICONS.sun : THEME_ICONS.moon;
    var label = t === "dark" ? "切换到亮色主题" : "切换到暗色主题";
    btn.setAttribute("aria-label", label);
    btn.setAttribute("title", label);
  }

  /* 按主题注入 utterances（主题切换时重新加载，评论区始终与页面主题一致） */
  function loadUtterances(theme) {
    var c = document.getElementById("utterances-container");
    if (!c) return;
    c.innerHTML = "";
    var s = document.createElement("script");
    s.src = "https://utteranc.es/client.js";
    s.setAttribute("repo", GITHUB_USER + "/wwsta.github.io");
    s.setAttribute("issue-term", "评论区");
    s.setAttribute("theme", theme === "dark" ? "github-dark" : "github-light");
    s.setAttribute("crossorigin", "anonymous");
    s.async = true;
    c.appendChild(s);
    scheduleCommentsCheck();
  }

  function syncThemeResources(t) {
    /* 提交记录 SVG：亮 / 暗各一份（未生成或不可达时由 onerror 整节隐藏） */
    var snake = document.getElementById("snake-img");
    if (snake) {
      var snakeNext = t === "dark" ? SNAKE_SRC_DARK : SNAKE_SRC_LIGHT;
      if (snake.getAttribute("src") !== snakeNext) snake.setAttribute("src", snakeNext);
    }
    /* 技术栈图标：skillicons 支持 theme 参数；已降级为文字徽章时 img 已不在 DOM */
    var skills = document.getElementById("skills-img");
    if (skills) {
      var skillsNext = SKILLS_SRC_BASE + t;
      if (skills.getAttribute("src") !== skillsNext) skills.setAttribute("src", skillsNext);
    }
    /* 评论区按主题重新注入 */
    loadUtterances(t);
  }

  function applyTheme(t, persist) {
    document.documentElement.setAttribute("data-theme", t);
    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, t);
      } catch (e) {
        /* 隐私模式下 localStorage 不可用时忽略 */
      }
    }
    updateThemeButton(t);
    syncThemeResources(t);
  }

  function toggleTheme() {
    applyTheme(currentTheme() === "dark" ? "light" : "dark", true);
  }

  function initTheme() {
    var t = currentTheme();
    updateThemeButton(t);
    syncThemeResources(t);
    var btn = document.getElementById("theme-toggle");
    if (btn) btn.addEventListener("click", toggleTheme);
    /* 用户未手动选择时，跟随系统主题变化 */
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onChange = function (e) {
        var saved = null;
        try {
          saved = localStorage.getItem(THEME_KEY);
        } catch (err) {}
        if (saved !== "light" && saved !== "dark") {
          applyTheme(e.matches ? "dark" : "light", false);
        }
      };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  }

  /* ---------------- utterances：未安装或无法访问时整节隐藏 ---------------- */

  var commentsCheckTimer = null;

  function scheduleCommentsCheck() {
    if (commentsCheckTimer) clearTimeout(commentsCheckTimer);
    commentsCheckTimer = setTimeout(function () {
      var c = document.getElementById("utterances-container");
      var section = document.getElementById("comments");
      /* 超过 8 秒仍未加载出评论框：视为未安装或无法访问，整节隐藏（说明见 README） */
      if (c && section && !c.querySelector("iframe")) section.hidden = true;
    }, 8000);
  }

  function watchUtterances() {
    var c = document.getElementById("utterances-container");
    var section = document.getElementById("comments");
    if (!c || !section) return;

    window.addEventListener("load", scheduleCommentsCheck);

    /* 若评论框加载出来，自动恢复显示 */
    if (typeof MutationObserver !== "undefined") {
      new MutationObserver(function () {
        if (c.querySelector("iframe")) section.hidden = false;
      }).observe(c, { childList: true, subtree: true });
    }
  }

  /* ---------------- 启动：先静态渲染，再尝试动态更新 ---------------- */

  renderAll();
  bindTabs();
  bindFallbacks();
  watchUtterances();
  startTyping();
  initTheme(); // 应用主题（含按钮图标、外链资源联动、评论区注入）
  fetchLive();
})();

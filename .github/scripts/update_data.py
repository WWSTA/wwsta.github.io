#!/usr/bin/env python3
"""从 GitHub 公开 API 重新生成 js/data.js（静态快照）。

用法：
    python .github/scripts/update_data.py                # 匿名（60 次/小时/IP）
    GH_TOKEN=xxx python .github/scripts/update_data.py   # 认证（5000 次/小时）

安全说明：
    - 仅使用标准库，无第三方依赖；
    - token 只从环境变量 GH_TOKEN 读取，仅用于请求头，绝不打印、不写入文件；
    - GitHub Actions 中使用内置的临时 GITHUB_TOKEN（job 结束即失效）。
"""

import json
import os
import sys
import urllib.request
from datetime import datetime, timezone

USER = "WWSTA"
API = "https://api.github.com"
OUT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "js", "data.js"))


def fetch(url):
    req = urllib.request.Request(url)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("User-Agent", "wwsta-homepage-data-updater")
    token = os.environ.get("GH_TOKEN")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


def js(value):
    """JSON 字面量即合法 JS 字面量；中文字符保持原样。"""
    return json.dumps(value, ensure_ascii=False)


def main():
    user = fetch(f"{API}/users/{USER}")
    repos = fetch(f"{API}/users/{USER}/repos?per_page=100&sort=updated")

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    lines = [
        "/* ============================================================",
        "   WWSTA 个人主页 —— 静态快照数据（自动生成，请勿手改）",
        "   数据来源：GitHub 公开 API（用户信息 + 全部仓库，含 About homepage）",
        "   更新方式：.github/workflows/update-data.yml 每日自动运行",
        "             .github/scripts/update_data.py 重新生成本文件",
        "   文章数据在 js/articles.js 中人工维护",
        "   ============================================================ */",
        "",
        "window.SNAPSHOT = {",
        "  generatedAt: " + js(now) + ",",
        "  user: {",
        "    login: " + js(user.get("login")) + ",",
        "    name: " + js(user.get("name")) + ",",
        "    avatarUrl: " + js(user.get("avatar_url")) + ",",
        "    bio: " + js(user.get("bio")) + ",",
        "    followers: " + str(user.get("followers", 0)) + ",",
        "    following: " + str(user.get("following", 0)) + ",",
        "    publicRepos: " + str(user.get("public_repos", 0)) + ",",
        "    createdAt: " + js(user.get("created_at")) + ",",
        "    htmlUrl: " + js(user.get("html_url")),
        "  },",
        "  repos: [",
    ]

    for i, r in enumerate(repos):
        lines.extend([
            "    {",
            "      name: " + js(r.get("name")) + ",",
            "      description: " + js(r.get("description")) + ",",
            "      fork: " + ("true" if r.get("fork") else "false") + ",",
            "      stargazers: " + str(r.get("stargazers_count", 0)) + ",",
            "      forks: " + str(r.get("forks_count", 0)) + ",",
            "      language: " + js(r.get("language")) + ",",
            "      htmlUrl: " + js(r.get("html_url")) + ",",
            "      homepage: " + js(r.get("homepage") or None) + ",",
            "      updatedAt: " + js(r.get("updated_at")),
            "    }" + ("," if i < len(repos) - 1 else ""),
        ])

    lines.extend(["  ]", "};", ""])

    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines))

    print(f"Wrote {OUT} ({len(repos)} repos, generatedAt={now})")


if __name__ == "__main__":
    sys.exit(main())

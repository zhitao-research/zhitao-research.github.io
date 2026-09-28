# 刘志涛 / Zhitao Liu · 个人学术网站

中英双语学术主页。内容与样式分开维护，无第三方运行依赖；构建只需要 Node.js 24。生成的网页可直接打开，也可部署到 GitHub Pages。

预定发布地址：<https://zhitao-research.github.io/>（英文）、<https://zhitao-research.github.io/zh/>（中文）。地址是否已上线，以 GitHub Actions 的部署结果为准。

## 日常更新

| 更新内容 | 修改文件 |
|---|---|
| 姓名、简介、单位、邮箱、经历、资助与荣誉 | `content/profile.json` |
| 添加论文或修改论文信息 | `content/publications.json` |
| 配色、字号与排版 | `assets/style.css` |
| 栏目结构、界面翻译和页面生成方式 | `scripts/build.mjs` |

中文和英文文本分别放在 `zh` 与 `en` 字段。请同步更新两种语言；论文原始标题不翻译。每次内容变化后，更新 `profile.json` 中的 `updated` 日期。

在 GitHub 上打开相应 JSON 文件，点击编辑并提交至 `main` 分支。启用 GitHub Pages 的 GitHub Actions 发布方式后，提交会自动生成、检查并发布新版本；不需要手动修改 `dist` 中的 HTML。

论文条目格式：

```json
{
  "id": "p26",
  "title": "论文原始标题",
  "authors": "作者列表，通讯作者保留 *",
  "year": 2026,
  "journal": "期刊名称",
  "doi": "10.xxxx/真实DOI",
  "citation": "完整书目信息，包括卷期页码或文章编号。",
  "role": "lead",
  "featured": false
}
```

`id` 必须唯一且已有条目不要改动；`role` 仅使用 `lead`（第一或通讯作者）或 `collaborator`（合作作者）。`featured: true` 的论文会展示在首页，通常保留三篇。JSON 最后一项后不要加逗号。示例 DOI 是格式说明，不能原样用于真实条目。

## 本地检查与预览

在本目录运行：

```powershell
node scripts/build.mjs
node scripts/check.mjs
node scripts/serve.mjs
```

第三条命令输出一个本地地址；浏览器打开该地址即可预览，中文页面在 `/zh/`。服务器使用临时空闲端口，按 Ctrl+C 停止。也可直接打开 `dist/index.html` 或 `dist/zh/index.html`。网页导航、语言切换与论文链接不依赖 JavaScript。

检查覆盖论文必需字段、DOI 重复、页面内部链接、语言路径、公开内容边界和两种语言的论文完整性。此检查不等于外部 DOI 已逐一核验，也不等于视觉检查。

## 首次发布到 GitHub Pages

1. 使用 `zhitao-research` 账号创建公开仓库 `zhitao-research.github.io`。
2. 把本项目源码提交至该仓库的 `main` 分支。
3. 在仓库 `Settings → Pages → Build and deployment` 中选择 `GitHub Actions`。
4. 打开 `Actions → Build and publish website`，必要时点击 `Run workflow`。
5. 等待 `build` 和 `deploy` 成功，再访问网站地址。

工作流仅发布 `dist/`，不会把项目根目录、维护记录和构建脚本作为网站文件提供。但公开仓库中的已提交文件仍可被任何人查看，因此原始私人简历、账号凭证和未公开材料不应进入仓库。

GitHub 官方流程：[Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。工作流使用最小发布权限，没有第三方平台账户或数据库。

## 长期维护与回退

- 每次更新形成一个 Git 提交，并写清变化，例如 `Add 2027 settlement paper`。
- 发布失败时查看 Actions 的失败步骤；修正后重新提交即可。
- 内容有误时恢复相应 JSON 的上一个版本再提交，网站会自动重新生成。
- 更换域名时，同时更新 `scripts/build.mjs` 的 `base`，并在 GitHub Pages 配置新域名。
- 静态网站不需要常驻服务器维护。新增论文、职务变更及数据发布时更新内容；不自动从学术平台抓取或编造更新。

当前版依据作者提供的2026年9月10日简历制作。基金矛盾和书目统计口径见本地 `CONTENT_REVIEW.md`。公开页面未展示手机号、私人邮箱、影响因子或尚待确认的国家自然科学基金条目。公开版 Markdown 简历由同一份内容自动生成。

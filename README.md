# 刘志涛 / Zhitao Liu · 个人学术网站

中英双语学术主页。内容与样式分开维护，无第三方运行依赖；构建只需要 Node.js 24。生成的网页可直接打开，也可部署到 GitHub Pages。

预定发布地址：<https://zhitao-research.github.io/>（英文）、<https://zhitao-research.github.io/zh/>（中文）。地址是否已上线，以 GitHub Actions 的部署结果为准。

## 日常更新

| 更新内容 | 修改文件 |
|---|---|
| 姓名、简介、单位、邮箱、经历、资助与荣誉 | `content/profile.json` |
| 添加论文或修改论文信息 | `content/publications.json` |
| 期刊 IF、JCR 分区、Nature Portfolio 归属及中文数据库收录 | `content/journals.json` |
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
  "featured": false,
  "topics": ["settlements"]
}
```

`id` 必须唯一且已有条目不要改动；`role` 仅使用 `lead`（第一或通讯作者）或 `collaborator`（合作作者）。`featured: true` 的论文会展示在首页，通常保留三篇。JSON 最后一项后不要加逗号。示例 DOI 是格式说明，不能原样用于真实条目。

`topics` 可填一个或多个研究方向：`settlements`（城乡聚落演变）、`ecology`（土地变化与生态环境效应）、`sustainability`（韧性与可持续发展）。每个方向的两篇常显论文仍在 `profile.json` 的 `topics[].papers` 中指定，其余同方向论文自动放入默认收起的列表。各方向允许交叉归类，不能在同一方向内重复。

`journals.json` 按期刊名称集中维护指标，同一期刊的全部论文同步使用该记录。IF 和 JCR 的 `year` 为指标年份，不是报告发布年份；JCR 同时存储学科和来源，多个学科分区不一致时分别展示。中文收录区分 CSSCI 来源/扩展版、CSCD 核心/扩展库；未明确目录年份时 `edition` 保留 `null`，页面显示“官网收录说明”，不能自行补年。Nature Portfolio 仅用于该出版品牌旗下期刊，不泛指 Springer Nature 的所有期刊。

2026-09-28核对：英文指标以2025年为主，Science of the Total Environment 使用明确标年的2024年历史值。部分 JCR/IF 来自公开二手目录，未经订阅数据库逐项复核；网页可点击每个指标查看来源。中文 CSCD 使用2025–2026目录；地理学报、城市问题的 CSSCI 官方网页没有确认当前目录版次，页面不标该版次。

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

当前版依据作者提供的2026年9月10日简历制作，网站保留首页、研究方向、学术论文、关于我四个栏目。基金矛盾和书目统计口径见本地 `CONTENT_REVIEW.md`。公开页面未展示手机号、私人邮箱或尚待确认的国家自然科学基金条目。公开版 Markdown 简历由同一份内容自动生成。

# Personal academic website

- 默认使用简体中文沟通。网站同时维护英文根目录和 `zh/` 中文目录。
- 所有学术事实来自作者提供或已核验的资料，不虚构论文、项目、指标、数据下载地址或合作关系。
- 日常内容只编辑 `content/profile.json` 和 `content/publications.json`。公开目录 `dist/` 由 `node scripts/build.mjs` 生成，避免手动修改后被覆盖。
- 用户已选择 GitHub Pages，目标账号为 `zhitao-research`，仓库为 `zhitao-research.github.io`。保留该方案，除非用户要求更换。
- 仅公开学术邮箱；不加入手机号、私人邮箱、凭证或原始私人简历。`CONTENT_REVIEW.md` 为本地维护资料，不提交至公开仓库。
- 未确认的国家自然科学基金项目信息暂不公开；不得把未来执行期表述成当前在研。
- 保留英文/中文论文原始标题与通讯作者标记。同研究的中英文版本保留书目，不宣传为独立研究数量。
- 没有新增依赖的实际需求时，保持 Node.js 内置模块构建，不引入框架、数据库或自动内容采集。
- 修改后运行 `node scripts/build.mjs` 和 `node scripts/check.mjs`。布局变更需实际浏览器视觉检查；工具不可用时明确说明未完成视觉验证。
- 发布前检查 Git 状态及远端，避免覆盖用户新增内容。只发布 `dist/`。完成发布后确认 GitHub Actions 成功，并检查线上中英文页面。

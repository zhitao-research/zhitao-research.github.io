import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const readJSON = async name => JSON.parse((await readFile(path.join(root, 'content', name), 'utf8')).replace(/^\uFEFF/, ''));
const profile = await readJSON('profile.json');
const papers = await readJSON('publications.json');
const out = path.join(root, 'dist');
await mkdir(path.join(out, 'zh'), { recursive: true });
await mkdir(path.join(out, 'assets'), { recursive: true });
await mkdir(path.join(out, 'files'), { recursive: true });
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const base = 'https://zhitao-research.github.io';
const routes = ['index', 'research', 'publications', 'resources', 'about'];
const translations = {
  en: {
    nav: ['Home', 'Research', 'Publications', 'Data & Code', 'About'],
    skip: 'Skip to content', nameAlt: '刘志涛', language: '中文', langLabel: '切换为中文',
    site: 'Academic website', researchFocus: 'Research focus', focusTitle: 'Settlements, ecosystems & a changing planet',
    explore: 'Explore my research', email: 'Get in touch', selected: 'Selected publications', allPapers: 'All publications',
    about: 'About me', more: 'Background & experience', readPaper: 'Read paper',
    researchTitle: 'Research', researchIntro: 'Understanding the evolution of urban and rural settlements and their ecological consequences.',
    funding: 'Research support', publicationsTitle: 'Publications', publicationsIntro: 'Research on settlements, ecological change and sustainability.',
    publicationNote: 'Publications are listed by bibliographic year. Original titles are retained; Chinese and English versions of related work are listed separately. * Corresponding author.',
    browseYear: 'Browse by year', lead: 'First / corresponding author', collaboration: 'Co-authored',
    resourcesTitle: 'Data & code', resourcesIntro: 'Research resources for studying urban and rural settlements.',
    dataset: 'Dataset paper', datasetTitle: 'Global urban and rural settlements, 2000–2020',
    datasetText: 'A published dataset for examining the spatial patterns and changes of urban and rural settlements worldwide between 2000 and 2020.',
    datasetAccess: 'See the paper’s Data Records and Data Availability sections for the repository links, access conditions and recommended citation.',
    datasetButton: 'Read the dataset paper', codeTitle: 'Research code', codeText: 'My GitHub profile is the entry point for public code and future research repositories.', codeButton: 'Visit GitHub',
    aboutTitle: 'About & experience', aboutIntro: 'Human geography · Chinese Academy of Sciences', career: 'Education & appointments', awards: 'Selected honours', service: 'Academic service',
    serviceText: 'Journal reviewer for the following journals, as recorded in my September 2026 CV.', contact: 'Contact', cv: 'Download public CV', updated: 'Content updated',
    footer: 'Zhitao Liu · Human Geography', cvTitle: 'Zhitao Liu — Public academic CV'
  },
  zh: {
    nav: ['首页', '研究方向', '学术论文', '数据与代码', '关于我'],
    skip: '跳转至正文', nameAlt: 'Zhitao Liu', language: 'EN', langLabel: 'Switch to English',
    site: '个人学术主页', researchFocus: '研究关注', focusTitle: '城乡聚落、生态系统与变化中的地球',
    explore: '了解我的研究', email: '联系我', selected: '代表性论文', allPapers: '全部论文',
    about: '关于我', more: '教育与学术经历', readPaper: '阅读论文',
    researchTitle: '研究方向', researchIntro: '理解城乡聚落的演变过程及其生态环境效应。',
    funding: '科研资助', publicationsTitle: '学术论文', publicationsIntro: '围绕城乡聚落、生态环境变化与可持续发展开展研究。',
    publicationNote: '按书目年份倒序排列，保留论文原始标题；相关研究的中英文版本分别列出。* 表示通讯作者。',
    browseYear: '按年份浏览', lead: '第一 / 通讯作者', collaboration: '合作论文',
    resourcesTitle: '数据与代码', resourcesIntro: '面向城乡聚落研究的数据资源与代码入口。',
    dataset: '数据集论文', datasetTitle: '全球城乡聚落数据集，2000—2020年',
    datasetText: '覆盖2000—2020年的全球城乡聚落数据集，用于研究城市与乡村聚落的空间格局及其变化。',
    datasetAccess: '数据仓库入口、获取条件与引用方式，请参阅论文中的 Data Records 和 Data Availability 部分。',
    datasetButton: '查看数据集论文', codeTitle: '研究代码', codeText: '通过我的 GitHub 主页访问公开代码与后续发布的研究仓库。', codeButton: '访问 GitHub',
    aboutTitle: '关于我与学术经历', aboutIntro: '人文地理学 · 中国科学院', career: '教育与工作经历', awards: '部分荣誉', service: '学术服务',
    serviceText: '根据2026年9月个人简历记录，担任以下期刊审稿人。', contact: '联系我', cv: '下载公开版简历', updated: '内容更新',
    footer: '刘志涛 · 人文地理学', cvTitle: '刘志涛｜公开版学术简历'
  }
};
const link = (href, text, cls = '') => `<a href="${esc(href)}"${cls ? ` class="${cls}"` : ''}>${esc(text)}</a>`;
const doiURL = p => `https://doi.org/${p.doi}`;
const personNames = value => esc(value).replace(/Liu, Z\.|刘志涛/g, '<strong>$&</strong>');

function paperRow(p, t) {
  // Keep volume and page/article information from the source citation.
  const journalAt = p.citation.lastIndexOf(p.journal);
  const journalStart = journalAt > 0 && p.citation[journalAt - 1] === '《' ? journalAt - 1 : journalAt;
  const journalCitation = journalStart >= 0 ? p.citation.slice(journalStart) : `${p.journal} (${p.year})`;
  return `<article class="pub" id="${esc(p.id)}"><h3>${link(doiURL(p),p.title)}</h3><p>${personNames(p.authors)}</p><p class="journal">${esc(journalCitation)}</p><p><span class="contribution">${esc(p.role === 'lead' ? t.lead : t.collaboration)}</span>${link(doiURL(p),`DOI: ${p.doi}`,'doi')}</p></article>`;
}
function renderHome(lang, t, prefix) {
  const selected = ['10.1038/s43247-025-03082-7','10.1038/s41597-024-04195-y','10.1007/s11430-025-1844-7'].map(doi => papers.find(p=>p.doi===doi)).filter(p=>p?.featured);
  const otherSelected = papers.filter(p=>p.featured && !selected.includes(p));
  return `<section class="hero"><div><p class="eyebrow">${t.site}</p><h1>${esc(profile.name[lang])}<span>${t.nameAlt}</span></h1><p class="role">${esc(profile.role[lang])}</p><p class="institution">${esc(profile.institution[lang])}</p><p class="intro">${esc(profile.intro[lang])}</p><div class="links">${link('research.html',t.explore,'button')}${link(`mailto:${profile.email}`,t.email,'text-link')}${link(profile.orcid,'ORCID','text-link')}</div></div><aside class="focus-panel"><p class="eyebrow">${t.researchFocus}</p><h2>${t.focusTitle}</h2>${profile.topics.map((topic,i)=>`<div class="focus-item"><span class="number">0${i+1}</span><div><h3>${link(`research.html#topic-${i+1}`,topic.title[lang])}</h3><p>${esc(topic.text[lang])}</p></div></div>`).join('')}</aside></section>
  <section class="section"><div class="section-head"><h2>${t.selected}</h2>${link('publications.html',`${t.allPapers} →`,'text-link')}</div><div class="featured">${[...selected,...otherSelected].map(p=>`<article class="feature"><p class="tag">${p.year} · ${p.doi.includes('s41597') ? (lang==='zh'?'数据论文':'DATA PAPER') : (lang==='zh'?'研究论文':'RESEARCH ARTICLE')}</p><h3>${link(doiURL(p),p.title)}</h3><div class="journal">${esc(p.journal)}</div>${link(doiURL(p),`${t.readPaper} ↗`,'text-link')}</article>`).join('')}</div></section>
  <section class="section home-about"><h2>${t.about}</h2><div><p>${esc(profile.bio[lang])}</p>${link('about.html',`${t.more} →`,'text-link')}</div></section>`;
}
function heading(title, intro, t) { return `<header class="page-heading"><p class="eyebrow">${t.site}</p><h1>${title}</h1><p class="lead">${intro}</p></header>`; }
function research(lang,t) {
  return heading(t.researchTitle,t.researchIntro,t)+profile.topics.map((topic,i)=>`<section class="research-block" id="topic-${i+1}"><span class="number">0${i+1}</span><div><h2>${esc(topic.title[lang])}</h2><p>${esc(topic.text[lang])}</p></div><ul class="related">${topic.papers.map(doi=>{const p=papers.find(p=>p.doi===doi);if(!p)throw new Error(`Missing related DOI: ${doi}`);return `<li>${link(doiURL(p),p.title)}<small>${esc(p.journal)} · ${p.year}</small></li>`}).join('')}</ul></section>`).join('')+`<section class="section"><h2>${t.funding}</h2><div class="grant-grid">${profile.grants.map(g=>`<article class="grant"><p>${esc(g.date)}</p><h3>${esc(g.title[lang])}</h3><p>${esc(g.role[lang])}</p></article>`).join('')}</div></section>`;
}
function publications(lang,t) {
  const years = [...new Set(papers.map(p=>p.year))].sort((a,b)=>b-a);
  return heading(t.publicationsTitle,t.publicationsIntro,t)+`<p class="note">${t.publicationNote}</p><div class="publication-layout"><nav class="year-index" aria-label="${t.browseYear}"><p>${t.browseYear}</p>${years.map(year=>link(`#year-${year}`,year)).join('')}</nav><div>${years.map(year=>`<section class="year-group" id="year-${year}"><h2>${year}</h2>${papers.filter(p=>p.year===year).map(p=>paperRow(p,t)).join('')}</section>`).join('')}</div></div>`;
}
function resources(lang,t) {
  return heading(t.resourcesTitle,t.resourcesIntro,t)+`<section class="resource"><div><p class="resource-label">${t.dataset}</p><h2>${t.datasetTitle}</h2><p class="resource-meta">Scientific Data · 2024</p></div><div><p>${t.datasetText}</p><p class="resource-meta">${t.datasetAccess}</p>${link('https://doi.org/10.1038/s41597-024-04195-y',`${t.datasetButton} ↗`,'button')}</div></section><section class="resource"><div><p class="resource-label">GITHUB</p><h2>${t.codeTitle}</h2></div><div><p>${t.codeText}</p>${link(profile.github,`${t.codeButton} ↗`,'text-link')}</div></section>`;
}
function about(lang,t,prefix) {
  return heading(t.aboutTitle,t.aboutIntro,t)+`<div class="about-layout"><div><p class="intro">${esc(profile.bio[lang])}</p><section><h2>${t.career}</h2><ol class="timeline">${profile.career.map(c=>`<li><time>${esc(c.date)}</time><h3>${esc(c.title[lang])}</h3><p>${esc(c.place[lang])}</p><p>${esc(c.detail[lang])}</p></li>`).join('')}</ol></section><section><h2>${t.awards}</h2><ul class="award-list">${profile.awards.map(a=>`<li><time>${esc(a.date)}</time>${esc(a.title[lang])}</li>`).join('')}</ul></section><section><h2>${t.service}</h2><p>${t.serviceText}</p><ul class="service-list">${profile.reviewJournals.map(j=>`<li>${esc(j)}</li>`).join('')}</ul></section></div><aside><div class="contact-card"><h2>${t.contact}</h2><p>${esc(profile.institution[lang])}</p><p>${link(`mailto:${profile.email}`,profile.email)}</p><div class="links">${link(profile.orcid,'ORCID ↗')}${link(profile.researchgate,'ResearchGate ↗')}${link(profile.github,'GitHub ↗')}${link(`${prefix}files/cv-${lang}.md`,`${t.cv} ↓`)}</div></div></aside></div>`;
}
const renderers = { index: renderHome, research, publications, resources, about };
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#142b3b"/><text x="32" y="43" text-anchor="middle" fill="white" font-family="Georgia,serif" font-size="35">L</text><path d="M14 51h36" stroke="#78c4a3" stroke-width="3"/></svg>`;
for (const lang of ['en','zh']) {
  const t=translations[lang], prefix=lang==='zh'?'../':'';
  for (const route of routes) {
    const index=routes.indexOf(route), title=`${t.nav[index]} | ${profile.name[lang]}`, url=`${base}/${lang==='zh'?'zh/':''}${route==='index'?'':route+'.html'}`;
    const alt=lang==='zh'?`../${route}.html`:`zh/${route}.html`;
    const description=route==='index'?profile.intro[lang]:({research:t.researchIntro,publications:t.publicationsIntro,resources:t.resourcesIntro,about:profile.bio[lang]})[route];
    const person={ '@context':'https://schema.org','@type':'Person',name:'Zhitao Liu',alternateName:'刘志涛',url:base,email:profile.email,jobTitle:'Postdoctoral Researcher',affiliation:{'@type':'Organization',name:profile.institution.en},sameAs:[profile.orcid,profile.researchgate,profile.github] };
    const html=`<!doctype html>
<html lang="${lang==='zh'?'zh-CN':'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="color-scheme" content="light"><meta name="theme-color" content="#142b3b"><link rel="canonical" href="${url}"><link rel="alternate" hreflang="en" href="${base}/${route==='index'?'':route+'.html'}"><link rel="alternate" hreflang="zh-CN" href="${base}/zh/${route==='index'?'':route+'.html'}"><link rel="alternate" hreflang="x-default" href="${base}/${route==='index'?'':route+'.html'}"><link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(favicon)}"><link rel="stylesheet" href="${prefix}assets/style.css"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url}"><meta property="og:type" content="website"><meta property="og:locale" content="${lang==='zh'?'zh_CN':'en_US'}">${route==='index'?`<script type="application/ld+json">${JSON.stringify(person).replace(/</g,'\\u003c')}</script>`:''}</head>
<body><a class="skip" href="#main">${t.skip}</a><header class="site-header"><div class="wrap nav-row"><a class="brand" href="index.html">Zhitao Liu <span>刘志涛</span></a><nav class="main-nav" aria-label="${lang==='zh'?'主导航':'Main navigation'}">${routes.map((r,i)=>`<a href="${r}.html"${r===route?' aria-current="page"':''}>${t.nav[i]}</a>`).join('')}</nav><a class="language" href="${alt}" lang="${lang==='zh'?'en':'zh-CN'}" aria-label="${t.langLabel}">${t.language}</a></div></header><main id="main" class="wrap">${renderers[route](lang,t,prefix)}</main><footer class="site-footer"><div class="wrap footer-row"><p>© ${profile.updated.slice(0,4)} ${t.footer}</p><p>${t.updated} ${profile.updated} ${link(profile.github,'GitHub')}${link(`mailto:${profile.email}`,'Email')}</p></div></footer></body></html>`;
    await writeFile(path.join(out,lang==='zh'?'zh':'',`${route}.html`),html);
  }
  const cv=`# ${t.cvTitle}\n\n${profile.role[lang]}\n\n${profile.institution[lang]}\n\nEmail: ${profile.email}\n\nORCID: ${profile.orcid}\n\n${profile.bio[lang]}\n\n## ${t.career}\n\n${profile.career.map(c=>`- **${c.date} | ${c.title[lang]}** — ${c.place[lang]}. ${c.detail[lang]}`).join('\n')}\n\n## ${t.funding}\n\n${profile.grants.map(g=>`- ${g.date} | ${g.title[lang]} (${g.role[lang]})`).join('\n')}\n\n## ${t.publicationsTitle}\n\n${[...papers].sort((a,b)=>b.year-a.year).map(p=>`- ${p.citation} https://doi.org/${p.doi}`).join('\n\n')}\n\n## ${t.awards}\n\n${profile.awards.map(a=>`- ${a.date} | ${a.title[lang]}`).join('\n')}\n\n## ${t.service}\n\n${t.serviceText}\n\n${profile.reviewJournals.join('; ')}.\n\n${t.updated}: ${profile.updated}\n`;
  await writeFile(path.join(out,'files',`cv-${lang}.md`),cv);
}
await copyFile(path.join(root,'assets','style.css'),path.join(out,'assets','style.css'));
await writeFile(path.join(out,'.nojekyll'),'');
await writeFile(path.join(out,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
await writeFile(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['','zh/'].flatMap(lang=>routes.map(r=>`<url><loc>${base}/${lang}${r==='index'?'':r+'.html'}</loc><lastmod>${profile.updated}</lastmod></url>`)).join('')}</urlset>`);
await writeFile(path.join(out,'404.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found | Zhitao Liu</title><body style="font:18px/1.8 system-ui;max-width:650px;margin:10vh auto;padding:25px"><h1>Page not found / 页面不存在</h1><p><a href="/">English homepage</a> · <a href="/zh/">中文主页</a></p></body></html>`);
console.log(`Built 10 bilingual pages, 2 public CVs and static assets. ${papers.length} publication records.`);

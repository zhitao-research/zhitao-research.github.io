import { readFile, writeFile, mkdir, copyFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const readJSON = async name => JSON.parse((await readFile(path.join(root, 'content', name), 'utf8')).replace(/^\uFEFF/, ''));
const profile = await readJSON('profile.json');
const papers = await readJSON('publications.json');
const journals = await readJSON('journals.json');
const out = path.join(root, 'dist');
await mkdir(path.join(out, 'zh'), { recursive: true });
await mkdir(path.join(out, 'assets'), { recursive: true });
await mkdir(path.join(out, 'files'), { recursive: true });
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const base = 'https://zhitao-research.github.io';
const routes = ['index', 'research', 'publications', 'about'];
// Remove only the two retired, generated pages; preserve other public assets.
for (const retired of ['resources.html', 'zh/resources.html']) await rm(path.join(out, retired), { force: true });
const translations = {
  en: {
    nav: ['Home', 'Research', 'Publications', 'About'],
    skip: 'Skip to content', nameAlt: '刘志涛', language: '中文', langLabel: '切换为中文',
    site: 'Academic website', researchFocus: 'Research focus', focusTitle: 'Settlements, ecosystems & a changing planet',
    explore: 'Explore my research', email: 'Get in touch', selected: 'Selected publications', allPapers: 'All publications',
    about: 'About me', more: 'Background & experience', readPaper: 'Read paper',
    researchTitle: 'Research', researchIntro: 'Understanding the evolution of urban and rural settlements and their ecological consequences.',
    funding: 'Research support', publicationsTitle: 'Publications', publicationsIntro: 'Research on settlements, ecological change and sustainability.',
    publicationNote: 'Publications are listed by bibliographic year. Original titles are retained; Chinese and English versions of related work are listed separately. * Corresponding author.',
    browseYear: 'Browse by year', lead: 'First / corresponding author', collaboration: 'Co-authored',
    morePapers: 'More related publications', fewerPapers: 'Show fewer publications',
    metricsLabel: 'Journal metrics and indexing', pendingJcr: 'JCR quartile: verification pending', pendingIf: 'Impact factor: verification pending',
    metricsNote: 'Indicators refer to the years shown, not the publication year. IF means Journal Impact Factor; JCR quartiles are category-specific, not CAS divisions. Some values rely on public secondary directories and have not been checked against subscribed JCR. Follow each indicator for its source; Chinese indexing editions are shown where confirmed.',
    aboutTitle: 'Background & experience', aboutIntro: 'Human geography · Chinese Academy of Sciences', career: 'Education & appointments', awards: 'Selected honours', service: 'Academic service',
    serviceText: 'Journal reviewer for the following journals.', contact: 'Contact', updated: 'Content updated',
    portraitTitle: 'Click to meet me', portraitHints: ['Click the image', 'Press and hold for 2 seconds to see my photo', 'Zhitao Liu'],
    portraitLabels: ['Avatar: click to reveal a masked dog', 'Masked dog: hold for 2 seconds to reveal my photo', 'Photo of Zhitao Liu'],
    portraitKeyboard: 'With a keyboard, press Enter or Space once, then hold Enter or Space for 2 seconds. Releasing early cancels the reveal.',
    footer: 'Zhitao Liu · Human Geography', cvTitle: 'Zhitao Liu — Public academic CV'
  },
  zh: {
    nav: ['首页', '研究方向', '学术论文', '关于我'],
    skip: '跳转至正文', nameAlt: 'Zhitao Liu', language: 'EN', langLabel: 'Switch to English',
    site: '个人学术主页', researchFocus: '研究关注', focusTitle: '城乡聚落、生态系统与变化中的地球',
    explore: '了解我的研究', email: '联系我', selected: '代表性论文', allPapers: '全部论文',
    about: '关于我', more: '教育与学术经历', readPaper: '阅读论文',
    researchTitle: '研究方向', researchIntro: '理解城乡聚落的演变过程及其生态环境效应。',
    funding: '科研资助', publicationsTitle: '学术论文', publicationsIntro: '围绕城乡聚落、生态环境变化与可持续发展开展研究。',
    publicationNote: '按书目年份倒序排列，保留论文原始标题；相关研究的中英文版本分别列出。* 表示通讯作者。',
    browseYear: '按年份浏览', lead: '第一 / 通讯作者', collaboration: '合作论文',
    morePapers: '展开其他相关论文', fewerPapers: '收起其他相关论文',
    metricsLabel: '期刊指标与收录', pendingJcr: 'JCR 分区待核验', pendingIf: '影响因子待核验',
    metricsNote: '期刊指标采用标签所列年份，并非论文发表当年的指标。IF 为期刊影响因子；JCR 按学科列示，与中科院分区不同。部分数值来自公开二手目录，未经订阅版 JCR 逐项复核。点击标签可查看来源；中文收录仅标注已确认的目录版次。',
    aboutTitle: '教育背景与学术经历', aboutIntro: '人文地理学 · 中国科学院', career: '教育与工作经历', awards: '部分荣誉', service: '学术服务',
    serviceText: '担任以下期刊审稿人。', contact: '联系我', updated: '内容更新',
    portraitTitle: '点击看本人', portraitHints: ['单击照片', '长按照片2秒，查看本人', '刘志涛'],
    portraitLabels: ['简笔小人：单击显示蒙面狗', '蒙面狗：长按2秒显示本人照片', '刘志涛本人照片'],
    portraitKeyboard: '键盘操作：先按一次回车或空格，再按住回车或空格2秒。提前松开会取消。',
    footer: '刘志涛 · 人文地理学', cvTitle: '刘志涛｜公开版学术简历'
  }
};
const link = (href, text, cls = '') => `<a href="${esc(href)}"${cls ? ` class="${cls}"` : ''}>${esc(text)}</a>`;
const doiURL = p => `https://doi.org/${p.doi}`;
const personNames = value => esc(value).replace(/Liu, Z\.|刘志涛/g, '<strong>$&</strong>');

function journalMetrics(p, lang, t) {
  const journal = journals[p.journal];
  if (!journal) throw new Error(`Missing journal metadata: ${p.journal}`);
  const badges = [];
  const badge = (text, source, title, extra='') => source
    ? `<a class="metric ${extra}" href="${esc(source)}" title="${esc(title || text)}">${esc(text)}</a>`
    : `<span class="metric ${extra}">${esc(text)}</span>`;
  if (journal.language === 'en') {
    if (journal.naturePortfolio) badges.push(badge(lang==='zh'?'Nature 旗下期刊':'Nature Portfolio', journal.natureSource, lang==='zh'?'Nature Portfolio 旗下期刊':'A Nature Portfolio journal','nature'));
    const impact = journal.impactFactor;
    badges.push(impact?.value != null ? badge(`IF ${impact.value} · ${impact.year || (lang==='zh'?'年份待核验':'year unverified')}`, impact.source, impact.note?.[lang] || `${impact.year} Journal Impact Factor`) : badge(t.pendingIf));
    if (journal.quartiles?.length) {
      const groups = new Map();
      for (const q of journal.quartiles) {
        const key = `${q.year}-${q.quartile}`;
        if (!groups.has(key)) groups.set(key, { ...q, categories: [] });
        groups.get(key).categories.push(q.category);
      }
      for (const q of groups.values()) badges.push(badge(`JCR ${q.quartile} · ${q.year}${groups.size>1?` · ${q.categories.join(' / ')}`:''}`,q.source,`${q.categories.join('; ')} (${q.year})`));
    } else badges.push(badge(t.pendingJcr));
  } else {
    for (const idx of journal.indexes || []) badges.push(badge(`${idx.name}${idx.status ? ` ${idx.status[lang] || idx.status}` : ''}${idx.edition?` · ${idx.edition}`:''}`,idx.source));
  }
  return `<div class="journal-metrics" aria-label="${t.metricsLabel}">${badges.join('')}</div>`;
}

function paperRow(p, lang, t) {
  // Keep volume and page/article information from the source citation.
  const journalAt = p.citation.lastIndexOf(p.journal);
  const journalStart = journalAt > 0 && p.citation[journalAt - 1] === '《' ? journalAt - 1 : journalAt;
  const journalCitation = journalStart >= 0 ? p.citation.slice(journalStart) : `${p.journal} (${p.year})`;
  return `<article class="pub" id="${esc(p.id)}"><h3>${link(doiURL(p),p.title)}</h3><p>${personNames(p.authors)}</p><p class="journal">${esc(journalCitation)}</p>${journalMetrics(p,lang,t)}<p><span class="contribution">${esc(p.role === 'lead' ? t.lead : t.collaboration)}</span>${link(doiURL(p),`DOI: ${p.doi}`,'doi')}</p></article>`;
}
function renderHome(lang, t, prefix) {
  const selected = ['10.1038/s43247-025-03082-7','10.1038/s41597-024-04195-y','10.1007/s11430-025-1844-7'].map(doi => papers.find(p=>p.doi===doi)).filter(p=>p?.featured);
  const otherSelected = papers.filter(p=>p.featured && !selected.includes(p));
  return `<section class="hero"><div><p class="eyebrow">${t.site}</p><h1>${esc(profile.name[lang])}<span>${t.nameAlt}</span></h1><p class="role">${esc(profile.role[lang])}</p><p class="institution">${esc(profile.institution[lang])}</p><p class="intro">${esc(profile.intro[lang])}</p><div class="links">${link('research.html',t.explore,'button')}${link(`mailto:${profile.email}`,t.email,'text-link')}${link(profile.orcid,'ORCID','text-link')}</div></div><aside class="focus-panel"><p class="eyebrow">${t.researchFocus}</p><h2>${t.focusTitle}</h2>${profile.topics.map((topic,i)=>`<div class="focus-item"><span class="number">0${i+1}</span><div><h3>${link(`research.html#topic-${i+1}`,topic.title[lang])}</h3><p>${esc(topic.text[lang])}</p></div></div>`).join('')}</aside></section>
  <section class="section"><div class="section-head"><h2>${t.selected}</h2>${link('publications.html',`${t.allPapers} →`,'text-link')}</div><div class="featured">${[...selected,...otherSelected].map(p=>`<article class="feature"><p class="tag">${p.year} · ${p.doi.includes('s41597') ? (lang==='zh'?'数据论文':'DATA PAPER') : (lang==='zh'?'研究论文':'RESEARCH ARTICLE')}</p><h3>${link(doiURL(p),p.title)}</h3><div class="journal">${esc(p.journal)}</div>${journalMetrics(p,lang,t)}${link(doiURL(p),`${t.readPaper} ↗`,'text-link')}</article>`).join('')}</div></section>
  <section class="section home-about"><h2>${t.about}</h2><div><p>${esc(profile.bio[lang])}</p>${link('about.html',`${t.more} →`,'text-link')}</div></section>`;
}
function heading(title, intro, t) { return `<header class="page-heading"><p class="eyebrow">${t.site}</p><h1>${title}</h1><p class="lead">${intro}</p></header>`; }
function research(lang,t) {
  const leadFirst = (a,b) => Number(b.role==='lead') - Number(a.role==='lead');
  const relatedPaper = p => `<li data-paper="${esc(p.id)}" data-role="${p.role}">${link(doiURL(p),p.title)}<small>${esc(p.journal)} · ${p.year}</small><span class="contribution">${esc(p.role==='lead'?t.lead:t.collaboration)}</span>${journalMetrics(p,lang,t)}</li>`;
  return heading(t.researchTitle,t.researchIntro,t)+profile.topics.map((topic,i)=>{
    const selected = topic.papers.map(doi=>{const p=papers.find(p=>p.doi===doi);if(!p)throw new Error(`Missing related DOI: ${doi}`);return p;}).sort(leadFirst);
    const more = papers.filter(p=>p.topics.includes(topic.id)&&!selected.includes(p)).sort((a,b)=>leadFirst(a,b)||b.year-a.year);
    return `<section class="research-block" id="topic-${i+1}"><span class="number">0${i+1}</span><div><h2>${esc(topic.title[lang])}</h2><p>${esc(topic.text[lang])}</p></div><div class="topic-publications"><ul class="related">${selected.map(relatedPaper).join('')}</ul>${more.length?`<details class="more-papers"><summary><span class="when-closed">${t.morePapers} (${more.length})</span><span class="when-open">${t.fewerPapers}</span></summary><ul class="related">${more.map(relatedPaper).join('')}</ul></details>`:''}</div></section>`;
  }).join('')+`<section class="section"><h2>${t.funding}</h2><div class="grant-grid">${profile.grants.map(g=>`<article class="grant"><p>${esc(g.date)}</p><h3>${esc(g.title[lang])}</h3><p>${esc(g.role[lang])}</p></article>`).join('')}</div></section>`;
}
function publications(lang,t) {
  const years = [...new Set(papers.map(p=>p.year))].sort((a,b)=>b-a);
  return heading(t.publicationsTitle,t.publicationsIntro,t)+`<div class="note"><p>${t.publicationNote}</p><p>${t.metricsNote}</p></div><div class="publication-layout"><nav class="year-index" aria-label="${t.browseYear}"><p>${t.browseYear}</p>${years.map(year=>link(`#year-${year}`,year)).join('')}</nav><div>${years.map(year=>`<section class="year-group" id="year-${year}"><h2>${year}</h2>${papers.filter(p=>p.year===year).map(p=>paperRow(p,lang,t)).join('')}</section>`).join('')}</div></div>`;
}
function portrait(lang,t,prefix) {
  return `<div class="portrait-reveal" data-stage="0" ${t.portraitHints.map((hint,i)=>`data-hint${i}="${esc(hint)}" data-label${i}="${esc(t.portraitLabels[i])}"`).join(' ')}><p class="portrait-title">${t.portraitTitle}</p><button type="button" class="portrait-button" aria-label="${esc(t.portraitLabels[0])}" aria-describedby="portrait-hint portrait-keyboard"><span class="portrait-frames">${['avatar.png','masked-dog.png','zhitao-liu.jpg'].map((file,i)=>`<img class="portrait-layer" src="${prefix}assets/images/${file}" alt="" width="400" height="400" draggable="false"${i?' hidden':''}>`).join('')}</span><span class="portrait-progress" aria-hidden="true"></span></button><p class="portrait-status" id="portrait-hint" role="status" aria-live="polite">${esc(t.portraitHints[0])}</p><p class="sr-only" id="portrait-keyboard">${t.portraitKeyboard}</p><noscript><p>${lang==='zh'?'开启 JavaScript 后可点击与长按查看照片。':'Enable JavaScript to reveal the photos.'}</p></noscript></div>`;
}
function about(lang,t,prefix) {
  return heading(t.aboutTitle,t.aboutIntro,t)+`<div class="about-layout"><div><p class="intro">${esc(profile.bio[lang])}</p><section><h2>${t.career}</h2><ol class="timeline">${profile.career.map(c=>`<li><time>${esc(c.date)}</time><h3>${esc(c.title[lang])}</h3><p>${esc(c.place[lang])}</p><p>${esc(c.detail[lang])}</p></li>`).join('')}</ol></section><section><h2>${t.awards}</h2><ul class="award-list">${profile.awards.map(a=>`<li><time>${esc(a.date)}</time>${esc(a.title[lang])}</li>`).join('')}</ul></section><section><h2>${t.service}</h2><p>${t.serviceText}</p><ul class="service-list">${profile.reviewJournals.map(j=>`<li>${esc(j)}</li>`).join('')}</ul></section></div><aside>${portrait(lang,t,prefix)}<div class="contact-card"><h2>${t.contact}</h2><p>${esc(profile.institution[lang])}</p><p>${link(`mailto:${profile.email}`,profile.email)}</p><div class="links">${link(profile.orcid,'ORCID ↗')}${link(profile.researchgate,'ResearchGate ↗')}${link(profile.github,'GitHub ↗')}</div></div></aside></div><script type="module" src="${prefix}assets/portrait.js"></script>`;
}
const renderers = { index: renderHome, research, publications, about };
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#142b3b"/><text x="32" y="43" text-anchor="middle" fill="white" font-family="Georgia,serif" font-size="35">L</text><path d="M14 51h36" stroke="#78c4a3" stroke-width="3"/></svg>`;
for (const lang of ['en','zh']) {
  const t=translations[lang], prefix=lang==='zh'?'../':'';
  for (const route of routes) {
    const index=routes.indexOf(route), title=`${t.nav[index]} | ${profile.name[lang]}`, url=`${base}/${lang==='zh'?'zh/':''}${route==='index'?'':route+'.html'}`;
    const alt=lang==='zh'?`../${route}.html`:`zh/${route}.html`;
    const description=route==='index'?profile.intro[lang]:({research:t.researchIntro,publications:t.publicationsIntro,about:profile.bio[lang]})[route];
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
await copyFile(path.join(root,'assets','portrait.js'),path.join(out,'assets','portrait.js'));
await mkdir(path.join(out,'assets','images'),{recursive:true});
for(const file of ['avatar.png','masked-dog.png','zhitao-liu.jpg']) await copyFile(path.join(root,'assets','images',file),path.join(out,'assets','images',file));
await writeFile(path.join(out,'.nojekyll'),'');
await writeFile(path.join(out,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
await writeFile(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['','zh/'].flatMap(lang=>routes.map(r=>`<url><loc>${base}/${lang}${r==='index'?'':r+'.html'}</loc><lastmod>${profile.updated}</lastmod></url>`)).join('')}</urlset>`);
await writeFile(path.join(out,'404.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found | Zhitao Liu</title><body style="font:18px/1.8 system-ui;max-width:650px;margin:10vh auto;padding:25px"><h1>Page not found / 页面不存在</h1><p><a href="/">English homepage</a> · <a href="/zh/">中文主页</a></p></body></html>`);
console.log(`Built ${routes.length * 2} bilingual pages, 2 public CVs and static assets. ${papers.length} publication records.`);

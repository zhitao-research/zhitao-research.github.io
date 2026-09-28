import assert from 'node:assert/strict';
import {readFile,readdir,stat,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(root,'dist');
const papers=JSON.parse((await readFile(path.join(root,'content/publications.json'),'utf8')).replace(/^\uFEFF/,''));
const profile=JSON.parse(await readFile(path.join(root,'content/profile.json'),'utf8'));
const journals=JSON.parse(await readFile(path.join(root,'content/journals.json'),'utf8'));
const topicIds=profile.topics.map(t=>t.id);
assert.equal(new Set(papers.map(p=>p.doi.toLowerCase())).size,papers.length,'Duplicate DOIs');
assert.equal(new Set(papers.map(p=>p.id)).size,papers.length,'Duplicate paper IDs');
for(const p of papers){for(const key of ['id','title','authors','year','journal','doi','citation','role'])assert.ok(p[key],`Missing ${key}`);assert.match(p.doi,/^10\.\d{4,9}\/\S+$/);assert.ok(['lead','collaborator'].includes(p.role));assert.ok(Number.isInteger(p.year));}
for(const p of papers){
  assert.ok(p.topics?.length,`Missing topic: ${p.id}`);
  assert.ok(p.topics.every(t=>topicIds.includes(t)),`Unknown topic: ${p.id}`);
  const journal=journals[p.journal];assert.ok(journal,`Missing journal metadata: ${p.journal}`);
  if(journal.language==='en'){
    if(journal.impactFactor?.value!=null)assert.ok(journal.impactFactor.source,`Unsourced IF: ${p.journal}`);
    for(const q of journal.quartiles||[]){assert.match(q.quartile,/^Q[1-4]$/);assert.ok(q.category&&q.year&&q.source,`Incomplete JCR data: ${p.journal}`);}
    if(journal.naturePortfolio)assert.ok(journal.natureSource,`Unsourced Nature claim: ${p.journal}`);
  }else{assert.equal(journal.language,'zh');for(const idx of journal.indexes||[])assert.ok(idx.name&&idx.status&&idx.source,`Incomplete indexing: ${p.journal}`);}
}
for(const topic of profile.topics){
  assert.equal(topic.papers.length,2,`Expected two featured papers: ${topic.id}`);
  assert.equal(new Set(topic.papers).size,2);
  for(const doi of topic.papers)assert.ok(papers.find(p=>p.doi===doi)?.topics.includes(topic.id));
}
async function walk(dir){const result=[];for(const name of await readdir(dir)){const file=path.join(dir,name);if((await stat(file)).isDirectory())result.push(...await walk(file));else result.push(file);}return result;}
const files=await walk(out);let linkCount=0;
for(const file of files){
  const content=await readFile(file,'utf8');
  assert.ok(!/15626099441|liuzht7@foxmail\.com|C:\\Users|待补充确认|42601369/.test(content),`Private or unconfirmed content leaked: ${file}`);
  if(!file.endsWith('.html'))continue;
  assert.ok(!content.includes('resources.html'),'Retired page is still linked');
  assert.match(content,/<html lang="(?:en|zh-CN)"/);
  const ids=[...content.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,`Duplicate IDs: ${file}`);
  for(const match of content.matchAll(/(?:href|src)="([^"]+)"/g)){
    const href=match[1];if(/^(https?:|mailto:|data:)/.test(href))continue;
    const [ref,anchor]=href.split('#');
    let target=ref.startsWith('/')?path.join(out,ref):path.resolve(path.dirname(file),ref||path.basename(file));
    if(ref.endsWith('/'))target=path.join(target,'index.html');
    assert.ok(target===out||target.startsWith(out+path.sep),'Path outside public folder');
    const targetContent=await readFile(target,'utf8');
    if(anchor)assert.ok(targetContent.includes(`id="${anchor}"`),`Broken anchor: ${file} -> ${href}`);
    linkCount++;
  }
}
for(const locale of ['','zh/']){
  const html=await readFile(path.join(out,locale,'publications.html'),'utf8');
  assert.equal((html.match(/class="pub"/g)||[]).length,papers.length);
  for(const p of papers)assert.ok(html.includes(`id="${p.id}"`));
  assert.equal((html.match(/class="journal-metrics"/g)||[]).length,papers.length);
  const research=await readFile(path.join(out,locale,'research.html'),'utf8');
  assert.equal((research.match(/<details class="more-papers">/g)||[]).length,3);
  assert.ok(!/<details[^>]*\bopen\b/.test(research),'Extra publications must start collapsed');
  for(const [i,topic] of profile.topics.entries()){
    const section=research.split(`id="topic-${i+1}"`)[1].split('</section>')[0];
    const expected=papers.filter(p=>p.topics.includes(topic.id)).map(p=>p.id).sort();
    const actual=[...section.matchAll(/data-paper="([^"]+)"/g)].map(m=>m[1]).sort();
    assert.deepEqual(actual,expected,`Missing/duplicate related papers: ${locale}${topic.id}`);
    assert.equal((section.split('<details')[0].match(/data-paper=/g)||[]).length,2);
  }
  const about=await readFile(path.join(out,locale,'about.html'),'utf8');
  assert.ok(about.includes(locale?'<h1>教育背景与学术经历</h1>':'<h1>Background & experience</h1>'));
  await assert.rejects(access(path.join(out,locale,'resources.html')));
}
console.log(`PASS: ${papers.length} publication records; ${files.filter(f=>f.endsWith('.html')).length} HTML pages; ${linkCount} local links/anchors; public-content checks.`);

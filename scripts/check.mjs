import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(root,'dist');
const papers=JSON.parse((await readFile(path.join(root,'content/publications.json'),'utf8')).replace(/^\uFEFF/,''));
assert.equal(new Set(papers.map(p=>p.doi.toLowerCase())).size,papers.length,'Duplicate DOIs');
assert.equal(new Set(papers.map(p=>p.id)).size,papers.length,'Duplicate paper IDs');
for(const p of papers){for(const key of ['id','title','authors','year','journal','doi','citation','role'])assert.ok(p[key],`Missing ${key}`);assert.match(p.doi,/^10\.\d{4,9}\/\S+$/);assert.ok(['lead','collaborator'].includes(p.role));assert.ok(Number.isInteger(p.year));}
async function walk(dir){const result=[];for(const name of await readdir(dir)){const file=path.join(dir,name);if((await stat(file)).isDirectory())result.push(...await walk(file));else result.push(file);}return result;}
const files=await walk(out);let linkCount=0;
for(const file of files){
  const content=await readFile(file,'utf8');
  assert.ok(!/15626099441|liuzht7@foxmail\.com|C:\\Users|待补充确认|42601369/.test(content),`Private or unconfirmed content leaked: ${file}`);
  if(!file.endsWith('.html'))continue;
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
}
console.log(`PASS: ${papers.length} publication records; ${files.filter(f=>f.endsWith('.html')).length} HTML pages; ${linkCount} local links/anchors; public-content checks.`);

/** Genuine Chrome interaction; all API responses replayed, no inference. */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve('..'),out=path.join(root,'artifacts/stage4_4');
const fixture=JSON.parse(await readFile(path.join(root,'artifacts/stage4_1/offline-fixtures.json'),'utf8'));
const replacement=JSON.parse(await readFile(path.join(out,'replacement-fixture.json'),'utf8'));
const key='whitney-learning-compass.draft.v1',origin='http://127.0.0.1:5173';
const browser=await chromium.launch({channel:'chrome',headless:true});
const checks=[],screenshots=[],layouts=[],audits=[],requests=[],errors=[];let inspectedStorage;
function check(name,value){assert.ok(value,name);checks.push(name);}
async function shot(page,name){await page.screenshot({path:path.join(out,name+'.png')});screenshots.push(name+'.png');}
async function layout(page,name){const result=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth,controls:[...document.querySelectorAll('.draft-actions button')].filter(e=>e.getClientRects().length).map(e=>({label:e.textContent,...e.getBoundingClientRect().toJSON()}))}));layouts.push({name,...result});check(name+' no horizontal overflow',result.width<=result.viewport);check(name+' accessible draft controls',result.controls.every(c=>c.left>=-1&&c.right<=result.viewport+1&&c.height>=44));}
async function audit(page,name){const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();audits.push({name,violations:a.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)})),manual_review:a.incomplete.map(v=>v.id)});check(name+' axe',a.violations.length===0);}
const saved=page=>page.getByText(/Saved on this device/).waitFor();
const storage=page=>page.evaluate(k=>localStorage.getItem(k),key);
async function createPlan(page,name='Catapult'){
 await page.getByRole('button',{name:'Load Explore Force & Motion example'}).click();await page.getByRole('checkbox',{name:/I accept the USD/}).check();
 await page.getByRole('button',{name:'Discover Programs',exact:true}).click();
 await page.locator('article.program-card').filter({has:page.getByRole('heading',{name,exact:true})}).getByRole('button',{name:'Select This Program'}).click();
 await page.getByRole('button',{name:'Generate Learning Journey'}).click();await page.getByRole('heading',{name:'A journey beyond the workshop'}).waitFor();
}
try {
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:width===1440?1000:844},reducedMotion:'reduce'}),page=await context.newPage();let offline=false,second=false,posts=0;
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',async route=>{const req=route.request(),url=new URL(req.url());if(url.origin!==origin)return route.abort();if(!url.pathname.startsWith('/api/'))return route.continue();if(offline)return route.abort();
   if(req.method()==='GET')return route.fulfill({json:url.pathname==='/api/health'?{status:'ok'}:{programs:replacement.catalog}});
   check('only known offline POST',req.method()==='POST'&&['/api/recommend','/api/journey'].includes(url.pathname));posts++;requests.push({width,path:url.pathname,kind:'offline replay'});
   return route.fulfill({json:url.pathname==='/api/recommend'?(second?replacement.response:fixture.cases.provided.response):(second?replacement.journey:fixture.journey)});
  });
  await page.goto(origin);await createPlan(page);
  await page.getByLabel('BEFORE Learning objectives 1',{exact:true}).fill('Recovered objective: compare real observations with a prediction.');
  await page.getByLabel('DURING Evidence collection 1',{exact:true}).fill('Recovered activity: leave measurements blank until the actual visit.');
  await page.getByLabel('Teacher notes and actual observations').fill('Teacher notes retained. No experiment has been conducted.');
  await page.getByLabel('Museum inquiry draft',{exact:true}).fill('Please confirm capacity, availability and any additional fees for our class.');
  await page.locator('.draft-toolbar').scrollIntoViewIfNeeded();if(width===1440&&await page.getByText('Saving…',{exact:true}).isVisible())await shot(page,'saving-1440');
  await saved(page);await layout(page,'saved-'+width);await shot(page,'saved-'+width);await audit(page,'saved-'+width);
  const raw=await storage(page),d=JSON.parse(raw);check(width+' all editable fields saved',d.edited.before.learning_objectives[0].startsWith('Recovered objective')&&d.edited.during.evidence_collection[0].startsWith('Recovered activity')&&d.notes.includes('No experiment')&&d.inquiry.includes('additional fees'));
  check(width+' no capabilities/traces in storage',!/(workflow_token|workflow_id|run_id|plan_id|PORTKEY_API_KEY|Authorization|offline-test-capability|tool_calls|provider_headers)/i.test(raw));check(width+' single storage entry',await page.evaluate(()=>localStorage.length)===1);check(width+' two deliberate POST replays',posts===2);if(width===1440)inspectedStorage=d;
  page.on('dialog',dialog=>dialog.type()==='beforeunload'?dialog.accept():dialog.dismiss());offline=true;await page.reload();await page.getByRole('button',{name:'Restore Draft',exact:true}).waitFor();
  check(width+' optional recovery',await page.getByText('Saved Draft — Not Revalidated').count()===0);await layout(page,'recovery-'+width);await shot(page,'recovery-'+width);await audit(page,'recovery-'+width);
  offline=true;await page.getByRole('button',{name:'Restore Draft',exact:true}).click();
  check(width+' recovered objective',(await page.getByLabel('BEFORE Learning objectives 1',{exact:true}).inputValue()).startsWith('Recovered objective'));check(width+' recovered during activity',(await page.getByLabel('DURING Evidence collection 1',{exact:true}).inputValue()).startsWith('Recovered activity'));
  await page.getByText('Saved Draft — Not Revalidated').waitFor();check(width+' no active authorization controls',await page.getByRole('button',{name:'Generate Learning Journey'}).count()===0&&await page.getByRole('button',{name:'Load latest activity'}).count()===0);
  await page.getByLabel('AFTER Follow-up classroom activity',{exact:true}).fill('Recovered offline edit: discuss only actual visit observations.');await saved(page);
  await page.locator('.historical-notice').scrollIntoViewIfNeeded();await shot(page,'restored-'+width);await layout(page,'restored-'+width);await audit(page,'restored-'+width);await page.getByLabel('BEFORE Learning objectives 1',{exact:true}).scrollIntoViewIfNeeded();await shot(page,'restored-editing-'+width);
  await page.getByRole('button',{name:'Review & Export',exact:true}).last().click();check(width+' edits retained in review',await page.getByText('Recovered offline edit: discuss only actual visit observations.',{exact:true}).isVisible());
  await page.evaluate(()=>{window.__printCalls=0;window.print=()=>window.__printCalls++;});await page.getByRole('button',{name:'Print / Save as PDF'}).click();check(width+' local print action',await page.evaluate(()=>window.__printCalls)===1);
  if(width===1440){await page.emulateMedia({media:'print'});await page.pdf({path:path.join(out,'restored-learning-plan.pdf'),format:'A4',printBackground:true,preferCSSPageSize:true});check('historical notice printed',await page.locator('.historical-notice').isVisible());check('draft controls excluded from print',!await page.locator('.draft-toolbar').isVisible());await page.emulateMedia({media:'screen'});}
  check(width+' no inference on restore/edit/print',posts===2);
  if(width===1440){
   await page.getByRole('button',{name:'Start New Plan',exact:true}).click();offline=false;second=true;await createPlan(page,'Simple Machines');await page.getByText(/Another learning plan is already saved/).waitFor();check('new program cannot silently replace saved plan',JSON.parse(await storage(page)).program.id==='ewm-catapult');await shot(page,'replacement-1440');
   page.removeAllListeners('dialog');page.once('dialog',d=>{check('replacement asks confirmation',d.message().includes('permanently replaced'));return d.dismiss();});await page.getByRole('button',{name:'Replace Saved Draft'}).click();check('canceled replacement preserves Catapult',JSON.parse(await storage(page)).program.id==='ewm-catapult');
   page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Replace Saved Draft'}).click();await saved(page);check('confirmed replacement stores Simple Machines',JSON.parse(await storage(page)).program.id==='ewm-simple-machines');
   const tab=await context.newPage();await tab.goto(origin);await tab.evaluate(k=>{const d=JSON.parse(localStorage.getItem(k));d.notes='Changed by second test tab';localStorage.setItem(k,JSON.stringify(d));},key);await page.getByText(/changed in another tab/).waitFor();await shot(page,'tab-conflict-1440');check('other tab edit preserved',JSON.parse(await storage(page)).notes==='Changed by second test tab');await tab.close();
  }
  page.removeAllListeners('dialog');page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Delete Saved Draft'}).click();check(width+' canceled deletion preserves copy',await storage(page)!==null);
  page.once('dialog',d=>{check(width+' deletion explains in-memory retention',d.message().includes('currently open'));return d.accept();});await page.getByRole('button',{name:'Delete Saved Draft'}).click();await page.getByText(/Saved copy deleted. Your open plan remains/).waitFor();await page.locator('.draft-toolbar').scrollIntoViewIfNeeded();await shot(page,'deleted-'+width);
  check(width+' stored copy deleted',await storage(page)===null);check(width+' open document retained',await page.locator('.learning-plan').isVisible());await page.waitForTimeout(750);check(width+' deletion survives debounce',await storage(page)===null);
  page.on('dialog',d=>d.accept());await page.reload();await page.getByRole('button',{name:'Load Explore Force & Motion example'}).waitFor();check(width+' no recovery after delete/reload',await page.getByRole('button',{name:'Restore Draft',exact:true}).count()===0);await page.getByRole('button',{name:'Load Explore Force & Motion example'}).click();check(width+' normal new intake available',await page.getByRole('button',{name:'Discover Programs',exact:true}).isVisible());
  await page.evaluate(k=>localStorage.setItem(k,'{bad JSON'),key);await page.reload();await page.getByText('Your saved draft is unavailable').waitFor();check(width+' corrupt draft cannot restore',await page.getByRole('button',{name:'Restore Draft',exact:true}).count()===0);await shot(page,'corrupt-'+width);await layout(page,'corrupt-'+width);await page.getByRole('button',{name:'Start Fresh',exact:true}).click();check(width+' start fresh after corrupt storage',await page.getByRole('button',{name:'Discover Programs',exact:true}).isVisible());await context.close();
 }
 check('zero browser JavaScript errors',errors.length===0);
 await writeFile(path.join(out,'storage-inspection.json'),JSON.stringify({kind:'Actual localStorage snapshot from offline UI replay; not a live model result',draft:inspectedStorage},null,2)+'\n');
 await writeFile(path.join(out,'browser-regression.json'),JSON.stringify({executed_at:new Date().toISOString(),kind:'Actual Chrome interactions; all API replies offline replay, backend unavailability simulated; zero model calls',checks,layouts,audits,requests,errors,screenshots},null,2)+'\n');console.log(JSON.stringify({checks:checks.length,layouts:layouts.length,audits:audits.length,screenshots:screenshots.length,offline_posts:requests.length,errors:errors.length}));
}catch(error){await writeFile(path.join(out,'browser-failure.json'),JSON.stringify({error:String(error),checks,layouts,audits,errors},null,2));throw error;}finally{await browser.close();}

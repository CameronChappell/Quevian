// Isolated component QA. Generated assets are temporary and never published.
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {SubscriptionSettings} from '../../components/queuepilot/subscription';
import {DataSettings} from '../../components/queuepilot/data-settings';
import {OperatorOverview} from '../../components/queuepilot/operator';
import {Conversation} from '../../components/queuepilot/ticket-extras';
import {TicketWorkspace} from '../../components/queuepilot/tickets';
import {Portal} from '../../components/queuepilot/portal';
import {useRemote} from '../../components/queuepilot/module-common';
import type {Workspace,TicketRow,Summary} from '../../lib/domain';
// The supervised preview uses HTTP; supply a cryptographic UUID helper only in this disposable fixture.
if(!crypto.randomUUID)crypto.randomUUID=()=>{const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const h=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`};
const user={id:'staff',name:'Demo Engineer',email:'staff@example.test'};
const workspace:Workspace={organization:{id:'demo',name:'Demo workspace',role:'Owner'},members:[{...user,role:'Owner'}],companies:[{id:'a',name:'Acme Demo',email:'',phone:'',address:'',notes:'',version:1},{id:'b',name:'Birch Demo',email:'',phone:'',address:'',notes:'',version:1}],contacts:[],boards:[{id:'help',name:'Help Desk',description:'',version:1,statuses:[{name:'New',closed:false},{name:'Waiting on Customer',closed:false},{name:'Resolved',closed:true}]},{id:'network',name:'Network',description:'',version:1,statuses:[{name:'Queued',closed:false},{name:'Review',closed:false},{name:'Done',closed:true}]}]};
let tickets:TicketRow[]=[{id:1001,title:'Printer needs attention',description:'A demo printer request.',companyId:'a',company:'Acme Demo',boardId:'help',board:'Help Desk',contactId:null,contact:null,status:'Waiting on Customer',closed:0,priority:'Normal',assigneeId:user.id,assignee:user.name,created:'2026-09-15T12:00:00Z',updated:'2026-09-15T12:00:00Z',version:1,mergedInto:null,responseDue:null,resolutionDue:null,responded:null,resolved:null},{id:1002,title:'Network access request',description:'A demo network request.',companyId:'b',company:'Birch Demo',boardId:'network',board:'Network',contactId:null,contact:null,status:'Queued',closed:0,priority:'High',assigneeId:null,assignee:'Unassigned',created:'2026-09-15T12:00:00Z',updated:'2026-09-15T12:00:00Z',version:1,mergedInto:null,responseDue:null,resolutionDue:null,responded:null,resolved:null}];
const summary:Summary={open:2,unassigned:1,critical:0,waiting:1,mine:1};
let savedViews:unknown[]=[];
const delay=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const detail=(t:TicketRow)=>({...t,notes:[],activity:[]});
window.fetch=async(input,init={})=>{
 const url=new URL(String(input),location.origin),path=url.pathname,p=init.body?JSON.parse(String(init.body)):{};
 if(path.endsWith('/subscription'))return Response.json({configured:true,required:false,status:'not_subscribed',seats:0,usedSeats:2,interval:'monthly',periodEnd:null,cancelAtPeriodEnd:false,hasSubscription:false});
 if(path.endsWith('/subscription/checkout'))return Response.json({url:undefined});
 if(path.endsWith('/privacy'))return Response.json({requests:[]});
 if(path==='/api/operator')return Response.json({healthy:true,jobs:[{name:'maintenance',status:'ok',last_completed:new Date().toISOString(),failures:0}],requests:[],mail:[],attachments:[]});
 if(path.startsWith('/fixture/')){await delay(path.endsWith('/slow')?8000:50);return Response.json({name:path.split('/').pop()})}
 if(path.endsWith('/config/saved-view')){if(init.method==='POST')savedViews.push({...p,id:String(savedViews.length+1)});return Response.json({records:savedViews})}
 if(path.includes('/config/'))return Response.json({records:[]});
 if(path==='/api/portal')return Response.json({user:{...user,email:'customer@example.test'},grants:[{id:'grant',orgId:'demo',companyId:'a',company:'Acme Demo',organization:'Demo workspace'}]});
 if(path==='/api/portal/demo/a')return Response.json({tickets:[{...tickets[0],id:1000,title:'Original merged request'},tickets[0]],total:2,projects:[],assets:[]});
 if(path==='/api/portal/demo/a/1000')return Response.json({...tickets[0],title:'Original merged request',mergedInto:1001,messages:[]});
 if(path==='/api/portal/demo/a/1001')return Response.json({...tickets[0],messages:[]});
 if(path.endsWith('/files'))return Response.json({files:[]});
 if(path.endsWith('/messages'))return Response.json({messages:[]});
 if(path.endsWith('/email'))return Response.json({recipient:'customer@example.test',attachments:[{id:'11111111-1111-4111-8111-111111111111',name:'Customer report.pdf',size:100}],imports:[],deliveries:[]});
 if(/\/tickets\/\d+$/.test(path)){const t=tickets.find(t=>t.id===Number(path.split('/').pop()));if(!t)return Response.json({error:'Ticket not found'},{status:404});if(init.method==='PATCH')Object.assign(t,p,{version:t.version+1});return Response.json(detail(t))}
 if(path.endsWith('/tickets')){
  if(init.method==='POST'){await delay(1200);const t={...tickets[0],...p,id:1003,company:workspace.companies.find(c=>c.id===p.companyId)?.name,board:workspace.boards.find(b=>b.id===p.boardId)?.name,version:1};tickets.push(t);return Response.json(detail(t))}
  const q=url.searchParams;let rows=tickets.filter(t=>(!q.get('board')||t.boardId===q.get('board'))&&(!q.get('company')||t.companyId===q.get('company'))&&(!q.get('status')||t.status===q.get('status'))&&(!q.get('q')||t.title.toLowerCase().includes(q.get('q')!.toLowerCase())));
  return Response.json({tickets:rows,total:rows.length,page:0,pageSize:12,summary});
 }
 return Response.json({error:'Unimplemented fixture endpoint: '+path},{status:404});
};
function RemoteProbe(){const [url,setUrl]=useState('/fixture/initial'),r=useRemote<{name:string}>(url);return <section><button onClick={()=>setUrl('/fixture/slow')}>Slow record</button> <button onClick={()=>setUrl('/fixture/fast')}>Fast record</button><p>Requested: {url}</p><p>Loaded: {r.data?.name??'none'}</p><p>{r.loading?'Loading':'Ready'}</p></section>}
function Fixture(){const [screen,setScreen]=useState('tickets'),[view,setView]=useState('all'),[board,setBoard]=useState('all'),[company,setCompany]=useState('all'),[totals,setTotals]=useState(summary),[revision,setRevision]=useState(0);return <><aside style={{padding:16,background:'#ececec',fontSize:14}}>Isolated UI fixture — no live records or email. <button onClick={()=>setScreen('subscription')}>Subscription fixture</button> · <button onClick={()=>setScreen('data')}>Data fixture</button> · <button onClick={()=>setScreen('operator')}>Operations fixture</button> · <button onClick={()=>setScreen('conversation')}>Email fixture</button> ·  <button onClick={()=>setScreen('tickets')}>Ticket fixture</button> · <button onClick={()=>{history.replaceState({},'',location.pathname+'?org=demo&ticket=1002');setRevision(r=>r+1)}}>Quick-open ticket 1002</button> · <button onClick={()=>setScreen('portal')}>Portal fixture</button> · <button onClick={()=>setScreen('remote')}>Loading fixture</button></aside>{screen==='subscription'?<SubscriptionSettings org="demo" owner/>:screen==='data'?<DataSettings org="demo" name="Demo workspace"/>:screen==='operator'?<OperatorOverview/>:screen==='conversation'?<Conversation org="demo" id={1001} write changed={()=>{}}/>:screen==='tickets'?<main style={{padding:24}}><TicketWorkspace org="demo" workspace={workspace} user={user} view={view} setView={setView} board={board} setBoard={setBoard} company={company} setCompany={setCompany} revision={revision} summary={totals} setSummary={setTotals} openDirectory={()=>{}}/></main>:screen==='portal'?<Portal/>:<RemoteProbe/>}</>}
createRoot(document.getElementById('root')!).render(<Fixture/>);

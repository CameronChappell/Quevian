// Isolated component QA. Generated assets are temporary and never published.
import React from 'react';
import {WorkspaceApp} from '../../components/queuepilot/workspace';
import {createRoot} from 'react-dom/client';
import type {Workspace,TicketRow,Summary} from '../../lib/domain';
// The local capture preview uses HTTP; production runs under HTTPS.
let demoRequestId=0;
if(!crypto.randomUUID)crypto.randomUUID=()=>('00000000-0000-4000-8000-'+String(++demoRequestId).padStart(12,'0')) as `${string}-${string}-${string}-${string}-${string}`;
const user={id:'staff',name:'Alex Morgan',email:'alex@example.test'};
const workspace:Workspace={organization:{id:'demo',name:'Northstar IT',role:'Owner'},members:[{...user,role:'Owner'},{id:'jordan',name:'Jordan Lee',email:'jordan@example.test',role:'Engineer'}],companies:[{id:'a',name:'Acme Studio',email:'',phone:'',address:'',notes:'',version:1},{id:'b',name:'Birch & Co.',email:'',phone:'',address:'',notes:'',version:1}],contacts:[],boards:[{id:'help',name:'Help Desk',description:'',version:1,statuses:[{name:'New',closed:false},{name:'In Progress',closed:false},{name:'Waiting on Customer',closed:false},{name:'Resolved',closed:true}]},{id:'network',name:'Network',description:'',version:1,statuses:[{name:'Queued',closed:false},{name:'Review',closed:false},{name:'Done',closed:true}]}]};
let tickets:TicketRow[]=[{id:1001,title:'Printer needs attention',description:'A demo printer request.',companyId:'a',company:'Acme Studio',boardId:'help',board:'Help Desk',contactId:null,contact:null,status:'Waiting on Customer',closed:0,priority:'Normal',assigneeId:user.id,assignee:user.name,created:'2026-09-15T12:00:00Z',updated:'2026-09-15T12:00:00Z',version:1,mergedInto:null,responseDue:null,resolutionDue:null,responded:null,resolved:null},{id:1002,title:'Network access request',description:'A demo network request.',companyId:'b',company:'Birch & Co.',boardId:'network',board:'Network',contactId:null,contact:null,status:'Queued',closed:0,priority:'High',assigneeId:null,assignee:'Unassigned',created:'2026-09-15T12:00:00Z',updated:'2026-09-15T12:00:00Z',version:1,mergedInto:null,responseDue:null,resolutionDue:null,responded:null,resolved:null}];
tickets.push(...['Laptop setup for new starter','VPN connection keeps dropping','Shared drive permissions','Meeting room display offline'].map((title,i)=>({...tickets[0],id:1003+i,title,status:i===0?'New':'In Progress',company:i%2?'Birch & Co.':'Acme Studio',companyId:i%2?'b':'a',assigneeId:i%2?'jordan':user.id,assignee:i%2?'Jordan Lee':user.name})));
const summary:Summary={open:6,unassigned:1,critical:0,waiting:1,mine:3};
const replies:{id:string;body:string;author:string;kind:string;at:string}[]=[];
if(new URLSearchParams(location.search).get('stage')==='assigned')tickets.unshift({...tickets[0],id:1007,title:'New employee account setup',description:'Create a workspace account and prepare laptop access for our new teammate.',status:'In Progress',assigneeId:'jordan',assignee:'Jordan Lee',version:3});
let savedViews:unknown[]=[];
const delay=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const detail=(t:TicketRow)=>({...t,notes:[],activity:[]});
window.fetch=async(input,init={})=>{
 const url=new URL(String(input),location.origin),path=url.pathname,p=init.body?JSON.parse(String(init.body)):{};
 if(path==='/api/account')return Response.json({user,organizations:[workspace.organization],invitations:[]});
 if(path==='/api/workspace/demo')return Response.json(workspace);
 if(path.startsWith('/fixture/')){await delay(path.endsWith('/slow')?8000:50);return Response.json({name:path.split('/').pop()})}
 if(path.endsWith('/config/saved-view')){if(init.method==='POST')savedViews.push({...p,id:String(savedViews.length+1)});return Response.json({records:savedViews})}
 if(path.includes('/config/'))return Response.json({records:[]});
 if(path==='/api/portal')return Response.json({user:{...user,email:'customer@example.test'},grants:[{id:'grant',orgId:'demo',companyId:'a',company:'Acme Studio',organization:'Demo workspace'}]});
 if(path==='/api/portal/demo/a')return Response.json({tickets:[{...tickets[0],id:1000,title:'Original merged request'},tickets[0]],total:2,projects:[],assets:[]});
 if(path==='/api/portal/demo/a/1000')return Response.json({...tickets[0],title:'Original merged request',mergedInto:1001,messages:[]});
 if(path==='/api/portal/demo/a/1001')return Response.json({...tickets[0],messages:[]});
 if(path.endsWith('/files'))return Response.json({files:[]});
 if(path.endsWith('/messages')){if(init.method==='POST')replies.push({id:String(replies.length+1),body:p.body,author:user.name,kind:'Staff',at:'2026-09-16T10:30:00Z'});return Response.json({messages:replies})}
 if(path.endsWith('/email'))return Response.json({recipient:'customer@example.test',deliveries:[]});
 if(/\/tickets\/\d+$/.test(path)){const t=tickets.find(t=>t.id===Number(path.split('/').pop()));if(!t)return Response.json({error:'Ticket not found'},{status:404});if(init.method==='PATCH')Object.assign(t,p,{assignee:p.assigneeId?workspace.members.find(m=>m.id===p.assigneeId)?.name:t.assignee,version:t.version+1});return Response.json(detail(t))}
 if(path.endsWith('/tickets')){
  if(init.method==='POST'){await delay(250);const t={...tickets[0],...p,id:1007,status:'New',assigneeId:null,assignee:'Unassigned',company:workspace.companies.find(c=>c.id===p.companyId)?.name,board:workspace.boards.find(b=>b.id===p.boardId)?.name,version:1};tickets.unshift(t);return Response.json(detail(t))}
  const q=url.searchParams;let rows=tickets.filter(t=>(!q.get('board')||t.boardId===q.get('board'))&&(!q.get('company')||t.companyId===q.get('company'))&&(!q.get('status')||t.status===q.get('status'))&&(!q.get('q')||t.title.toLowerCase().includes(q.get('q')!.toLowerCase())));
  summary.open=tickets.length;return Response.json({tickets:rows,total:rows.length,page:0,pageSize:12,summary});
 }
 return Response.json({error:'Unimplemented fixture endpoint: '+path},{status:404});
};

// Capture-only application: all requests stay in this fictional in-memory fixture.
createRoot(document.getElementById('root')!).render(<WorkspaceApp/>);

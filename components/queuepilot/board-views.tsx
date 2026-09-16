'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {toast} from 'sonner';
import {api,message,Picker,ErrorState} from './common';
import {Editor,useRemote} from './module-common';
import {can,type Workspace,type TicketRow} from '@/lib/domain';
import {canMoveTicket,type ViewFilters} from '@/lib/ticket-view';
export type {ViewFilters} from '@/lib/ticket-view';

export function BoardControls({org,workspace,filters,apply}:{org:string;workspace:Workspace;filters:ViewFilters;apply:(f:ViewFilters)=>void}){
 const {data,error,reload}=useRemote<{records:(ViewFilters&{id:string;name:string})[]}>('/api/workspace/'+org+'/config/saved-view');
 const [save,setSave]=useState(false);
 return <><div className="section-bar"><div className="heading-actions">
  <Picker label="Ticket layout" value={filters.layout} options={[{value:'table',label:'Table'},{value:'compact',label:'Compact'},{value:'kanban',label:'Kanban'}]} onChange={layout=>apply({...filters,layout})}/>
  <Picker label="Saved views" value="none" options={[{value:'none',label:'Saved views'},...(data?.records??[]).map(v=>({value:v.id,label:v.name}))]} onChange={id=>{const v=data?.records.find(v=>v.id===id);if(v)apply(v)}}/>
  {can(workspace.organization,'tickets:write')&&<Button size="sm" variant="outline" onClick={()=>setSave(true)}>Save view</Button>}
 </div>{filters.layout==='kanban'&&<small>Cards reflect this page’s filtered tickets. Use the status menu to move a card.</small>}</div>
 {error&&<ErrorState error={error} retry={reload}/>}
 {save&&<Editor org={org} title="Save shared view" description="This filter and layout will be available to the organization." initial={{name:''}} fields={[{key:'name',label:'View name',required:true}]} close={()=>setSave(false)} save={async v=>{await api('/api/workspace/'+org+'/config/saved-view','POST',{name:v.name,...filters});reload();toast.success('View saved')}}/>}</>;
}

export function Kanban({org,workspace,tickets,boardId='all',select,reload}:{org:string;workspace:Workspace;tickets:TicketRow[];boardId?:string;select:(n:number)=>void;reload:()=>void}){
 const [drag,setDrag]=useState<TicketRow|null>(null),[busy,setBusy]=useState(false);
 const boards=workspace.boards.filter(b=>boardId==='all'||b.id===boardId);
 const states=[...new Set([...boards.flatMap(b=>b.statuses.map(s=>s.name)),...tickets.map(t=>t.status)])];
 const writable=can(workspace.organization,'tickets:write');
 const move=async(ticket:TicketRow,status:string)=>{
  if(busy||!writable||!canMoveTicket(ticket,status,workspace.boards))return;
  setBusy(true);
  try{await api('/api/workspace/'+org+'/tickets/'+ticket.id,'PATCH',{status,version:ticket.version});toast.success('Status updated')}
  catch(e){toast.error(message(e))}
  finally{reload();setBusy(false);setDrag(null)}
 };
 return <div className="qp-kanban" aria-busy={busy}>{states.map(status=><section key={status}
  onDragOver={e=>{if(drag&&!busy&&writable&&canMoveTicket(drag,status,workspace.boards)){e.preventDefault();e.dataTransfer.dropEffect='move'}}}
  onDrop={e=>{e.preventDefault();if(drag)void move(drag,status)}}>
  <h3>{status} <small>{tickets.filter(t=>t.status===status).length}</small></h3>
  {tickets.filter(t=>t.status===status).map(t=><article key={t.id} draggable={!busy&&writable&&!t.mergedInto}
   onDragStart={e=>{e.dataTransfer.setData('text/plain',String(t.id));e.dataTransfer.effectAllowed='move';setDrag(t)}} onDragEnd={()=>setDrag(null)}>
   <small>#{t.id} · {t.priority}</small><button onClick={()=>select(t.id)}>{t.title}</button><p>{t.company}</p><small>{t.assignee}</small>
   {t.mergedInto?<small>Merged into #{t.mergedInto}</small>:writable&&<Picker label={'Status for ticket #'+t.id} value={t.status} options={workspace.boards.find(b=>b.id===t.boardId)?.statuses.map(s=>s.name)??[t.status]} disabled={busy} onChange={status=>void move(t,status)}/>}
  </article>)}
 </section>)}</div>;
}

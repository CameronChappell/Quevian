'use client';
import {useState} from 'react';
import {ArrowUp,ArrowDown,Plus,X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Picker} from './common';
import type {Status} from '@/lib/domain';
export function statusError(items:Status[]){
 if(items.some(s=>!s.name.trim()))return 'Give every status a name.';
 if(new Set(items.map(s=>s.name.trim().toLowerCase())).size!==items.length)return 'Each status needs a unique name.';
 if(!items.some(s=>!s.closed)||!items.some(s=>s.closed))return 'Keep at least one open and one closed status.';
 return '';
}
export function StatusEditor({items,onChange,disabled}:{items:Status[];onChange:(s:Status[])=>void;disabled:boolean}){
 const [query,setQuery]=useState(''),[filter,setFilter]=useState('all'),[draft,setDraft]=useState(''),[type,setType]=useState('open');
 const duplicate=items.some(s=>s.name.trim().toLowerCase()===draft.trim().toLowerCase()),error=statusError(items),firstOpen=items.findIndex(s=>!s.closed);
 const rows=items.map((s,i)=>({...s,i})).filter(s=>s.name.toLowerCase().includes(query.trim().toLowerCase())&&(filter==='all'||s.closed===(filter==='closed')));
 const move=(from:number,to:number)=>{const next=[...items];const [s]=next.splice(from,1);next.splice(to,0,s);onChange(next)};
 const add=()=>{if(!draft.trim()||duplicate||items.length>=30)return;onChange([...items,{name:draft.trim(),closed:type==='closed'}]);setDraft('');setQuery('');setFilter('all')};
 return <section className="board-status-manager"><div className="status-manager-heading"><strong>Ticket statuses</strong><span>{items.length}/30</span></div>
 <div className="status-manager-filters"><Input aria-label="Search statuses" placeholder="Find a status…" value={query} onChange={e=>setQuery(e.target.value)}/><Picker label="Filter statuses" value={filter} onChange={setFilter} options={[{value:'all',label:'All statuses'},{value:'open',label:'Open'},{value:'closed',label:'Closed'}]}/></div>
 <div className="status-manager-list">{rows.map(s=><div className="status-manager-item" key={s.i}><div className="status-manager-name"><Input aria-label={'Status '+(s.i+1)+' name'} value={s.name} maxLength={60} required disabled={disabled} onChange={e=>onChange(items.map((x,i)=>i===s.i?{...x,name:e.target.value}:x))}/>{s.i===firstOpen&&<small>Default for new tickets</small>}</div><Picker label={'Type for '+s.name} value={s.closed?'closed':'open'} disabled={disabled} options={[{value:'open',label:'Open'},{value:'closed',label:'Closed'}]} onChange={v=>onChange(items.map((x,i)=>i===s.i?{...x,closed:v==='closed'}:x))}/><div className="status-manager-actions"><Button type="button" variant="ghost" size="icon" aria-label={'Move '+s.name+' up'} disabled={disabled||s.i===0||!!query||filter!=='all'} onClick={()=>move(s.i,s.i-1)}><ArrowUp size={14}/></Button><Button type="button" variant="ghost" size="icon" aria-label={'Move '+s.name+' down'} disabled={disabled||s.i===items.length-1||!!query||filter!=='all'} onClick={()=>move(s.i,s.i+1)}><ArrowDown size={14}/></Button><Button type="button" variant="ghost" size="icon" aria-label={'Remove '+s.name} disabled={disabled||items.length<=2} onClick={()=>onChange(items.filter((_,i)=>i!==s.i))}><X size={14}/></Button></div></div>)}{!rows.length&&<p className="muted">No matching statuses. Clear your search or choose another type.</p>}</div>
 {!disabled&&<div className="status-manager-add"><strong>Add a status</strong><div><Input aria-label="New status name" placeholder="e.g. Waiting for approval" maxLength={60} value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();add()}}}/><Picker label="New status type" value={type} onChange={setType} options={[{value:'open',label:'Open'},{value:'closed',label:'Closed'}]}/><Button type="button" disabled={!draft.trim()||duplicate||items.length>=30} onClick={add}><Plus size={14}/>Add</Button></div>{duplicate&&<p className="form-error">This status already exists.</p>}{draft.trim()&&!duplicate&&<p className="muted">Click Add before saving the board.</p>}</div>}
 {error&&<p className="form-error" role="alert">{error}</p>}<p className="muted">Use the arrows to set the order. The first open status is the default. Statuses used by tickets must keep their name and type; move those tickets first before removing or changing a status.</p></section>;
}

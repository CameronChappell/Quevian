import type {Board,TicketRow,Workspace} from './domain';

export type ViewFilters={query:string;status:string;priority:string;sort:string;view:string;board:string;company:string;layout:string};

export function normalizeView(value:Partial<ViewFilters>,workspace:Pick<Workspace,'boards'|'companies'>):ViewFilters{
 const board=workspace.boards.some(b=>b.id===value.board)?value.board!:'all';
 const statuses=workspace.boards.filter(b=>board==='all'||b.id===board).flatMap(b=>b.statuses.map(s=>s.name));
 const choice=(v:string|undefined,allowed:string[],fallback:string)=>v&&allowed.includes(v)?v:fallback;
 return {query:value.query??'',status:statuses.includes(value.status??'')?value.status!:'',board,
  company:workspace.companies.some(c=>c.id===value.company)?value.company!:'all',
  priority:choice(value.priority,['Critical','High','Normal','Low'],'all'),sort:choice(value.sort,['priority'],'newest'),
  view:choice(value.view,['all','open','mine','unassigned','critical','waiting'],'all'),layout:choice(value.layout,['compact','kanban'],'table')};
}

export function canMoveTicket(ticket:Pick<TicketRow,'status'|'boardId'|'mergedInto'>,status:string,boards:Board[]){
 return !ticket.mergedInto&&ticket.status!==status&&!!boards.find(b=>b.id===ticket.boardId)?.statuses.some(s=>s.name===status);
}

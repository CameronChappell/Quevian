export const roles = ['Owner','Administrator','Manager','Engineer','Viewer'] as const;
export type Role = typeof roles[number];
export type Capability = 'tickets:write'|'directory:write'|'boards:write'|'team:write'|'organization:write'|'operations:write'|'projects:write'|'assets:write'|'time:write'|'automation:write';
export const permissions: Record<Role, readonly Capability[]> = {
 Owner:['tickets:write','directory:write','boards:write','team:write','organization:write','operations:write','projects:write','assets:write','time:write','automation:write'],
 Administrator:['tickets:write','directory:write','boards:write','team:write','organization:write','operations:write','projects:write','assets:write','time:write','automation:write'],
 Manager:['tickets:write','directory:write','boards:write','operations:write','projects:write','assets:write','time:write','automation:write'], Engineer:['tickets:write','time:write'], Viewer:[]
};
export const can=(subject:Role|{role:Role;capabilities?:readonly Capability[]},cap:Capability)=>typeof subject==='string'?(permissions[subject]?.includes(cap)??false):(subject.capabilities??permissions[subject.role]??[]).includes(cap);
export const priorities=['Critical','High','Normal','Low'] as const;
export type Status={name:string;closed:boolean};
export const defaultStatuses:Status[]=['New','Triage','In Progress','Waiting on Customer','Waiting on Vendor','Escalated','Resolved','Closed'].map(name=>({name,closed:['Resolved','Closed'].includes(name)}));
export type Identity={id:string;email:string;name:string};
export type Organization={id:string;name:string;role:Role;roleName?:string;capabilities?:Capability[]};
export type Company={id:string;name:string;email:string;phone:string;address:string;notes:string;version:number;ticketCount?:number};
export type Contact={id:string;companyId:string;company?:string;name:string;email:string;phone:string;title:string;version:number};
export type Board={priorityLabels?:Record<string,string>;id:string;name:string;description:string;statuses:Status[];version:number};
export type Member={id:string;name:string;email:string;role:Role};
export type TicketRow={mergedInto?:number|null;id:number;companyId:string;contactId:string|null;boardId:string;assigneeId:string|null;title:string;description:string;company:string;contact:string|null;board:string;assignee:string;status:string;priority:string;closed:number;created:string;updated:string;version:number;responseDue:string|null;resolutionDue:string|null;responded:string|null;resolved:string|null};
export type Note={id:string;body:string;author:string;at:string};
export type Audit={id:string;entityId:string;action:string;author:string;at:string;before:string|null;after:string|null};
export type TicketDetail=TicketRow & {notes:Note[];activity:Audit[]};
export type Summary={open:number;unassigned:number;critical:number;waiting:number;mine:number};
export type TicketPage={tickets:TicketRow[];total:number;page:number;pageSize:number;summary:Summary};
export type Workspace={organization:Organization;companies:Company[];contacts:Contact[];boards:Board[];members:Member[]};
export type Invitation={id:string;email:string;role:Role;name?:string;expires:string};
export type Account={user:Identity;organizations:Organization[];invitations:Invitation[]};
export type Schedule={id:string;ticketId:number|null;title:string;memberId:string;member:string;starts:string;ends:string;kind:string;notes:string;cancelled:number;version:number};
export type TimeEntry={id:string;ticketId:number;title:string;userId:string;person:string;starts:string;ends:string;minutes:number;description:string;billable:number;version:number};
export type Timer={ticketId:number;title:string;started:string}|null;
export type Project={id:string;companyId:string;company:string;name:string;description:string;ownerId:string|null;owner:string;status:string;due:string;estimatedHours:number;visible:number;version:number;taskCount:number;completedCount:number};
export type ProjectTask={id:string;projectId:string;title:string;memberId:string|null;member:string;due:string;done:number;version:number};
export type Asset={id:string;companyId:string;company:string;name:string;kind:string;manufacturer:string;model:string;serial:string;ip:string;mac:string;location:string;purchased:string;warranty:string;status:string;notes:string;visible:number;version:number};
export type SLAPolicy={priority:string;responseMinutes:number;resolutionMinutes:number;enabled:number;version:number};
export type Notification={id:string;title:string;ticketId:number|null;at:string;read:number};
export type Rule={id:string;name:string;trigger:string;priority:string;boardId:string;status:string;actions:{followupTitle?:string;notifyUserId?:string;taskTitle?:string;priority?:string;boardId?:string;status?:string;assigneeId?:string|null;note?:string};enabled:number;version:number};
export type PortalGrant={id:string;orgId:string;companyId:string;organization:string;company:string};
export type PublicMessage={id:string;body:string;author:string;kind:string;at:string};
export type Attachment={id:string;name:string;size:number;at:string;visibility:string};

export const priorityName=(workspace:Workspace,boardId:string,priority:string)=>workspace.boards.find(b=>b.id===boardId)?.priorityLabels?.[priority]??priority;

import {z} from 'zod';
import {HttpError,Service} from './service';
import {seatUsage} from './subscriptions';
export async function setMemberAccess(s:Service,org:string,userId:string,payload:unknown){
 const actor=await s.context(org,'team:write'),p=z.object({suspended:z.boolean()}).strict().parse(payload);
 const target=await s.one<{role:string}>('SELECT role FROM memberships WHERE org_id=? AND user_id=?',org,userId);
 if(!target)throw new HttpError(404,'Member not found.');
 if(target.role==='Owner'||s.user.id===userId||(target.role==='Administrator'&&actor.role!=='Owner'))throw new HttpError(403,'You cannot change this member’s access.');
 if(!p.suspended){const sub=await s.one<{seats:number;status:string}>('SELECT seats,status FROM workspace_subscriptions WHERE org_id=?',org);if(sub&&['active','trialing'].includes(sub.status)&&await seatUsage(s,org)>=sub.seats&&await s.one('SELECT user_id FROM suspended_memberships WHERE org_id=? AND user_id=?',org,userId))throw new HttpError(409,'Add a subscription seat before restoring this member.');}
 await s.db.batch([p.suspended?s.stmt('INSERT INTO suspended_memberships(org_id,user_id,at) VALUES(?,?,?) ON CONFLICT(org_id,user_id) DO NOTHING',org,userId,new Date().toISOString()):s.stmt('DELETE FROM suspended_memberships WHERE org_id=? AND user_id=?',org,userId),s.log(org,'member:'+userId,p.suspended?'Member access suspended':'Member access restored')]);
 return {ok:true};
}

import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
export function restoreBackup(snapshot,destination,filesDirectory){
 if(snapshot.format!=='quevian-backup-v1')throw new Error('Unsupported backup format');
 if(existsSync(destination))throw new Error('Restore destination must not exist');
 const quote=name=>{if(!/^[a-z_][a-z0-9_]*$/i.test(name))throw new Error('Invalid identifier');return '"'+name+'"'};
 const db=new DatabaseSync(destination);
 try{
  db.exec('PRAGMA foreign_keys=OFF; BEGIN');
  for(const entry of snapshot.schema.filter(x=>x.type==='table'))db.exec(entry.sql);
  for(const [name,rows] of Object.entries(snapshot.tables)){
   if(!rows.length)continue;const columns=Object.keys(rows[0]);const statement=db.prepare('INSERT INTO '+quote(name)+' ('+columns.map(quote).join(',')+') VALUES ('+columns.map(()=>'?').join(',')+')');
   for(const row of rows)statement.run(...columns.map(c=>row[c]));
  }
  for(const entry of snapshot.schema.filter(x=>x.type!=='table'))db.exec(entry.sql);
  if(db.prepare('PRAGMA foreign_key_check').all().length)throw new Error('Restored foreign keys are invalid');
  const integrity=db.prepare('PRAGMA integrity_check').get();if(Object.values(integrity)[0]!=='ok')throw new Error('Restored database integrity check failed');
  // A recovered database must not run pending work until provider state has been reconciled.
  if(snapshot.tables.job_runs)db.exec("UPDATE job_runs SET lease_until=0,token='',status='recovery_review'");
  db.exec('COMMIT; PRAGMA foreign_keys=ON');
  const restoredFiles=destination+'.files';if(snapshot.objects.length){if(existsSync(restoredFiles))throw new Error('Restored files destination must not exist');mkdirSync(restoredFiles)}
  const index=[];
  for(const object of snapshot.objects){
   if(!filesDirectory)throw new Error('The backup contains files; provide the downloaded files directory.');
   const file=resolve(filesDirectory,object.sha256),base=resolve(filesDirectory);if(relative(base,file).startsWith('..'))throw new Error('Unsafe file path');
   const bytes=readFileSync(file);if(bytes.length!==object.size||createHash('sha256').update(bytes).digest('hex')!==object.sha256)throw new Error('Backup file checksum failed');
   const restoredName=createHash('sha256').update(object.key).digest('hex');writeFileSync(join(restoredFiles,restoredName),bytes,{flag:'wx'});index.push({key:object.key,file:restoredName,sha256:object.sha256});
  }
  if(index.length)writeFileSync(join(restoredFiles,'index.json'),JSON.stringify(index,null,2),{flag:'wx'});
  return {tables:Object.keys(snapshot.tables).length,rows:Object.values(snapshot.tables).reduce((n,rows)=>n+rows.length,0),files:snapshot.objects.length,integrity:'ok'};
 }finally{db.close()}
}
if(process.argv[1]&&import.meta.url===new URL('file://'+resolve(process.argv[1])).href){const [, ,manifest,destination,files]=process.argv;if(!manifest||!destination){console.error('Usage: node scripts/restore-backup.mjs MANIFEST NEW_DATABASE [DOWNLOADED_FILES_DIRECTORY]');process.exit(1)}const result=restoreBackup(JSON.parse(readFileSync(manifest,'utf8')),resolve(destination),files?resolve(files):undefined);console.log(JSON.stringify(result));}

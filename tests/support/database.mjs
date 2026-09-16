import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';

// D1's transactional batch semantics over the application's actual migrations.
export class D1 {
 constructor(){this.sql=new DatabaseSync(':memory:');this.sql.exec('PRAGMA foreign_keys=ON');for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())this.sql.exec(readFileSync(join('drizzle',file),'utf8'));}
 prepare(sql){const db=this;return {args:[],_sql:sql,bind(...args){this.args=args;return this},async all(){return {results:db.sql.prepare(sql).all(...this.args),success:true,meta:{changes:Number(db.sql.prepare('SELECT changes() n').get().n)}}},async first(){return db.sql.prepare(sql).get(...this.args)??null},async run(){return {results:[],success:true,meta:{changes:Number(db.sql.prepare(sql).run(...this.args).changes)}}}};}
 async batch(statements){this.sql.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await (/\bRETURNING\b/i.test(s._sql)?s.all():s.run()));this.sql.exec('COMMIT');return result}catch(e){this.sql.exec('ROLLBACK');throw e}}
 close(){this.sql.close()}
}

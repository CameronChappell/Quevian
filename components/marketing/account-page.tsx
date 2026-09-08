import {Brand} from './brand';
import {AuthForm,type AuthMode} from './auth-form';
import {authReady} from '@/lib/auth/config';
import './marketing.css';
export function AccountPage({title,description,mode,next,tokenHash,tokenType}:{title:string;description:string;mode:AuthMode;next?:string;tokenHash?:string;tokenType?:string}){return <div className="qv-site qv-account-page"><header><Brand/><a href="/login">Back to login</a></header><main><h1>{title}</h1><p>{description}</p><AuthForm mode={mode} next={next} enabled={authReady()} tokenHash={tokenHash} tokenType={tokenType}/></main></div>}

import {Brand} from './brand';
import {ThemeToggle} from '@/components/theme-provider';
import './marketing.css';
export function ServicePage({title,children}:{title:string;children:React.ReactNode}){return <div className="qv-site"><header className="qv-header"><div className="qv-nav-wrap"><Brand/><nav className="qv-nav-actions"><ThemeToggle/><a href="/pricing">Pricing</a><a href="/login">Log in</a></nav></div></header><main className="qv-service-page"><h1>{title}</h1>{children}</main><footer className="qv-footer"><Brand/><nav aria-label="Footer"><a href="/support">Support</a><a href="/privacy">Privacy & data</a><a href="/terms">Service terms</a></nav></footer></div>}

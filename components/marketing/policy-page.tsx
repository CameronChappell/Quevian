import type {ReactNode} from 'react';
import {ServicePage} from './service-pages';
import {POLICY_DATE} from '@/lib/legal';
export function PolicyPage({title,summary,sections}:{title:string;summary:string;sections:{id:string;title:string;body:ReactNode}[]}){
 return <ServicePage title={title}>
  <p className="qv-policy-date">Effective {POLICY_DATE}</p>
  <p className="qv-policy-summary">{summary}</p>
  <nav className="qv-policy-contents" aria-label="On this page"><strong>On this page</strong><ol>{sections.map(s=><li key={s.id}><a href={'#'+s.id}>{s.title}</a></li>)}</ol></nav>
  {sections.map(s=><section className="qv-policy-section" id={s.id} key={s.id}><h2>{s.title}</h2>{s.body}</section>)}
  <aside className="qv-policy-contact"><h2>Questions or requests?</h2><p>Contact <a href="mailto:support@quevian.com">support@quevian.com</a>. Include your account email and the workspace involved, if relevant. Do not send passwords, payment-card details, or unnecessary customer information.</p></aside>
 </ServicePage>
}

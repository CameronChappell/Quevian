import React from 'react';
import {createRoot} from 'react-dom/client';
import {Landing,type MarketingPage} from '../components/marketing/landing';
import '../app/globals.css';
const segment=window.location.pathname.split('/').filter(Boolean).pop()??'';
const page:MarketingPage=['product','how-it-works','customer-portal','faq'].includes(segment)?segment as MarketingPage:'home';
createRoot(document.getElementById('root')!).render(<Landing page={page}/>);

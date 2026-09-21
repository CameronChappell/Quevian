'use client';

import {useState} from 'react';
import {ArrowRight, Check, ChevronDown, Minus, Plus} from 'lucide-react';
import {RadioGroup, RadioGroupItem} from '../ui/radio-group';
import {Input} from '../ui/input';

const features = [
  ['Ticket management', 'Boards, priorities, assignments, and a clear history of every request.'],
  ['Customer portal', 'A shared place for customers to submit requests and follow the conversation.'],
  ['Dispatch & time tracking', 'Coordinate your team’s schedule and keep time connected to the work.'],
  ['Projects & milestones', 'Bring tasks, budgets, and related tickets into the bigger picture.'],
  ['Customer & asset records', 'Keep companies, contacts, locations, and equipment within reach.'],
  ['Reports & team permissions', 'Review service activity and give teammates the access they need.'],
];

const questions = [
  ['How do I get started?', 'Create an account, then create your organization or accept an invitation to an existing workspace. From there, you can set up your service boards and invite your team.'],
  ['Who counts as a paid seat?', 'The price applies to each staff member with workspace access, including administrators and technicians. Customers who only use the customer portal do not count as paid seats.'],
  ['What is the difference between monthly and annual pricing?', 'The monthly rate is $19 per staff member. Annual pricing is $180 per staff member, paid upfront for the year—equivalent to $15 per month. Both include the same workspace features.'],
  ['Is there a minimum team size?', 'The Workspace plan starts with one staff member. The calculator shows estimates for teams of up to 500; it is a budgeting tool, not a purchase or a reservation.'],
  ['Can I bring my existing customer records?', 'Company and contact CSV imports are available in the workspace. Review the supported fields before uploading so your records arrive with the right details.'],
];

const dollars = (amount:number) => new Intl.NumberFormat('en-US', {style:'currency', currency:'USD', maximumFractionDigits:0}).format(amount);

export function Pricing() {
  const [billing, setBilling] = useState('monthly');
  const [seatInput, setSeatInput] = useState('5');
  const annual = billing === 'annual';
  const rate = annual ? 15 : 19;
  const seats = Number(seatInput);
  const validSeats = /^\d+$/.test(seatInput) && Number.isInteger(seats) && seats >= 1 && seats <= 500;
  const total = validSeats ? seats * rate : 0;

  function adjustSeats(change:number) {
    setSeatInput(String(Math.min(500, Math.max(1, (validSeats ? seats : 1) + change))));
  }

  return <div className="qv-pricing">
    <section className="qv-pricing-intro" aria-labelledby="pricing-title">
      <p className="qv-eyebrow">SIMPLE, TRANSPARENT PRICING</p>
      <h1 id="pricing-title">A clear price.<br/>A calmer service day.</h1>
      <p>One plan for your whole service workflow.<br className="qv-desktop-break"/> Pay for your team, not the customers you help.</p>
      <RadioGroup className="qv-billing-toggle" value={billing} onValueChange={setBilling} aria-label="Billing frequency">
        <label className={annual ? '' : 'is-selected'}><RadioGroupItem value="monthly"/>Monthly</label>
        <label className={annual ? 'is-selected' : ''}><RadioGroupItem value="annual"/>Annually <span>Save 21%</span></label>
      </RadioGroup>
    </section>

    <section className="qv-price-layout" aria-label="Workspace plan and cost estimate">
      <article className="qv-plan-card">
        <div className="qv-plan-heading"><h2>Quevian Workspace</h2><span>One complete plan</span></div>
        <p className="qv-plan-description">The everyday workspace for IT service providers and support teams.</p>
        <div className="qv-plan-price" aria-live="polite"><span>{dollars(rate)}</span><p>per staff member<br/>per month</p></div>
        <p className="qv-plan-billing">{annual ? '$180 per staff member, billed annually.' : 'Billed monthly. Choose annual to save $48 per seat each year.'}</p>
        <a className="qv-button qv-pricing-start" href="/signup">Get started <ArrowRight size={18}/></a>
        <div className="qv-plan-inclusions"><p>Everything in your service workspace</p><ul>{['Tickets & customer portal', 'Dispatch, scheduling & time tracking', 'Projects, milestones & budgets', 'Customer records, assets & reports'].map(feature=><li key={feature}><Check size={17} aria-hidden="true"/>{feature}</li>)}</ul></div>
      </article>

      <aside className="qv-cost-card" aria-labelledby="cost-title">
        <p className="qv-eyebrow">PLAN YOUR TEAM’S BUDGET</p>
        <h2 id="cost-title">See what it adds up to.</h2>
        <p>A little clarity before you get started.</p>
        <label className="qv-seat-label" htmlFor="pricing-seats">Staff members</label>
        <div className="qv-seat-control">
          <button type="button" onClick={()=>adjustSeats(-1)} disabled={validSeats && seats===1} aria-label="Remove one staff member"><Minus size={18}/></button>
          <Input id="pricing-seats" type="number" min="1" max="500" step="1" inputMode="numeric" value={seatInput} onChange={event=>setSeatInput(event.target.value)} aria-invalid={!validSeats} aria-describedby="seat-help"/>
          <button type="button" onClick={()=>adjustSeats(1)} disabled={validSeats && seats===500} aria-label="Add one staff member"><Plus size={18}/></button>
        </div>
        <p id="seat-help" className={'qv-seat-help'+(!validSeats?' is-invalid':'')}>{validSeats ? 'Customers in your portal are not paid seats.' : 'Enter a whole number from 1 to 500.'}</p>
        <div className="qv-cost-result" aria-live="polite" aria-atomic="true">
          <p>Estimated monthly cost</p>
          <div><strong>{validSeats ? dollars(total) : '—'}</strong><span>/ month</span></div>
          <p>{validSeats ? (annual ? `${dollars(total*12)} billed annually for ${seats} ${seats===1?'seat':'seats'}.` : `${seats} ${seats===1?'seat':'seats'} × $19, billed monthly.`) : 'Your estimate will appear here.'}</p>
          {annual && validSeats && <p className="qv-cost-saving">Save {dollars(seats*48)} per year compared with monthly.</p>}
        </div>
        <p className="qv-cost-note">USD, before applicable taxes.</p>
      </aside>
    </section>

    <section className="qv-pricing-features" aria-labelledby="included-title">
      <div className="qv-pricing-section-title"><p className="qv-eyebrow">ALL IN ONE WORKSPACE</p><h2 id="included-title">The whole workflow.<br/>Included from the start.</h2><p>The same tools, whether your team is one person or many.</p></div>
      <div className="qv-pricing-feature-grid">{features.map(([title,description])=><article key={title}><Check size={20} aria-hidden="true"/><h3>{title}</h3><p>{description}</p></article>)}</div>
      <a className="qv-text-link" href="/product/">Take a closer look at Quevian <ArrowRight size={17}/></a>
    </section>

    <section className="qv-pricing-faq" aria-labelledby="pricing-faq-title"><div><p className="qv-eyebrow">A FEW THINGS TO KNOW</p><h2 id="pricing-faq-title">Clear answers.<br/>Before you start.</h2></div><div>{questions.map(([question,answer])=><details key={question}><summary>{question}<ChevronDown size={18} aria-hidden="true"/></summary><p>{answer}</p></details>)}</div></section>
  </div>;
}

export function dayAt(now, zone) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: zone, year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(now).map(x=>[x.type,x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
// Find the first instant after a session's local date, including DST days.
export function dayBoundary(day, zone) {
  let lo=Date.parse(day+'T00:00:00Z')-86400000, hi=lo+3*86400000;
  while(hi-lo>1){const mid=Math.floor((lo+hi)/2);if(dayAt(mid,zone)<=day)lo=mid;else hi=mid;}
  return hi;
}
export function transition(state, action, now) {
  const s={...state};
  if(!['start','stop','end'].includes(action))throw new Error('Unknown timer action.');
  if(s.state==='Ended')return s;
  if(action==='start'&&s.state!=='Running'){s.first ||= now;s.since=now;s.state='Running';}
  if((action==='stop'||action==='end')&&s.state==='Running'){s.ms+=Math.max(0,now-s.since);s.since=0;s.state='Paused';}
  if(action==='end'){s.state='Ended';s.end=now;}
  return s;
}
export function view(s,now){return {day:s.day,state:s.state,elapsed:s.ms+(s.state==='Running'?Math.max(0,now-s.since):0)};}

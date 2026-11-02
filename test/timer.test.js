import test from 'node:test';import assert from 'node:assert/strict';
import {dayAt,dayBoundary,transition,view} from '../lib/timer.js';
const initial={day:'2026-11-02',state:'Ready',ms:0,since:0,first:0,end:0};
test('pause excludes breaks and resume keeps accumulated time',()=>{let s=transition(initial,'start',1000);s=transition(s,'start',2000);s=transition(s,'stop',6000);assert.equal(s.ms,5000);s=transition(s,'start',20000);assert.equal(view(s,23000).elapsed,8000);s=transition(s,'end',24000);assert.equal(s.ms,9000);assert.deepEqual(transition(s,'start',50000),s);});
test('end from ready closes the day with zero elapsed',()=>{const s=transition(initial,'end',5000);assert.equal(s.state,'Ended');assert.equal(s.ms,0);});
test('day boundaries respect spring and fall daylight saving changes',()=>{const zone='America/Los_Angeles';assert.equal(dayBoundary('2026-03-08',zone),Date.parse('2026-03-09T07:00:00Z'));assert.equal(dayBoundary('2026-11-01',zone),Date.parse('2026-11-02T08:00:00Z'));assert.equal(dayAt(Date.parse('2026-11-02T07:59:59Z'),zone),'2026-11-01');});

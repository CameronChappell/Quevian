import {runtimeSecurityProblems} from '../lib/runtime-security.ts';
const problems = runtimeSecurityProblems(process.env);
for (const problem of problems) console.error(problem);
if (problems.length) process.exitCode = 1;
else console.log('Supplied configuration passes presence/shape checks. This does not verify the deployed runtime, provider permissions, SMTP delivery, or billing approval.');

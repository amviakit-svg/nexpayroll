import fs from 'fs';

const path = 'd:/Python Project/Akhil Sir Project/nexpayroll/lib/leaveService.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace all remaining LeaveStatus occurrences with string casts in filters
content = content.replace(/LeaveStatus\.PENDING/g, "'PENDING' as any");
content = content.replace(/LeaveStatus\.APPROVED/g, "'APPROVED' as any");
content = content.replace(/LeaveStatus\.REJECTED/g, "'REJECTED' as any");
content = content.replace(/LeaveStatus\.CANCELLED/g, "'CANCELLED' as any");

fs.writeFileSync(path, content);
console.log('Replacements completed');

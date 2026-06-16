const crypto = require('crypto');

function digest(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

const users = [
  { name: 'Owner', pin: '8188', salt: 'seed-owner', currentHash: 'b8bd4925bf3c03b20feaa71da92aa34591227c16ce8540287289839226c499d3' },
  { name: 'Primeau Hill', pin: '7428', salt: 'seed-primeau', currentHash: 'ac57fe25e58cda65ee04575f5cd22a908d1b975c072e28fc350514e76f48f982' },
  { name: 'Jason Mulder', pin: '6187', salt: 'seed-jason', currentHash: 'f3b23c04274dad26e542afda28d5bddf6896c5550e6d23ed6cf08c027f2ff9b0' },
  { name: 'David Lundberg', pin: '6243', salt: 'seed-david', currentHash: 'c60074e2660742b8e9442c489fed80d4dcd3adc0087375eed1ac736654729d66' },
  { name: 'Shayla Hilliard', pin: '5219', salt: 'seed-shayla', currentHash: 'ed31f3fa0be958f5c966697a15e4c19ec8975ad249b6d4fc436d2048cb394386' },
  { name: 'Josh Hoffman', pin: '5080', salt: 'seed-josh', currentHash: '5b8880ceb089c547b15bb8b1144dca8e2b4c09164e54e28325f1c7137415a5e2' },
];

users.forEach(u => {
  const calculated = digest(`${u.salt}:${u.pin}`);
  console.log(`${u.name}:`);
  console.log(`  PIN: ${u.pin}`);
  console.log(`  Salt: ${u.salt}`);
  console.log(`  Current Hash:    ${u.currentHash}`);
  console.log(`  Calculated Hash: ${calculated}`);
  console.log(`  Matches?: ${u.currentHash === calculated ? 'YES' : 'NO'}`);
});

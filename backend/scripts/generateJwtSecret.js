# Script de génération de nouveau JWT secret
import crypto from 'crypto';

console.log('\n🔐 GÉNÉRATION DE NOUVEAU JWT SECRET\n');
console.log('Ancien secret (COMPROMIS): bhguihkhkhhjvhjhlkjlknjbbhjb\n');

const newSecret = crypto.randomBytes(64).toString('hex');

console.log('Nouveau secret (à copier dans .env):');
console.log('======================================');
console.log(newSecret);
console.log('======================================\n');

console.log('✅ Copiez ce secret dans backend/.env:');
console.log(`JWT_SECRET_KEY=${newSecret}\n`);

console.log('⚠️  Ne partagez JAMAIS ce secret!\n');

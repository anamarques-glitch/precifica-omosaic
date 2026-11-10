const crypto = require('crypto');

const COOKIE = 'mosaic_prec';

function token() {
  const senha = process.env.SITE_PASSWORD || '';
  return crypto.createHmac('sha256', 'precificacao-mosaic:' + senha).update('sessao').digest('hex');
}

function autenticado(req) {
  if (!process.env.SITE_PASSWORD) return false;
  const raw = req.headers.cookie || '';
  const m = raw.split(';').map(s => s.trim()).find(s => s.startsWith(COOKIE + '='));
  if (!m) return false;
  const v = Buffer.from(m.slice(COOKIE.length + 1));
  const t = Buffer.from(token());
  return v.length === t.length && crypto.timingSafeEqual(v, t);
}

function senhaConfere(senha) {
  const s = process.env.SITE_PASSWORD || '';
  if (!s || typeof senha !== 'string') return false;
  const a = crypto.createHash('sha256').update(senha).digest();
  const b = crypto.createHash('sha256').update(s).digest();
  return crypto.timingSafeEqual(a, b);
}

function cookieSessao() {
  return `${COOKIE}=${token()}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
}

module.exports = { autenticado, senhaConfere, cookieSessao };

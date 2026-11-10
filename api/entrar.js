const { senhaConfere, cookieSessao } = require('./_auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido.' });
  if (!process.env.SITE_PASSWORD) {
    return res.status(500).json({ erro: 'A senha do site ainda não foi definida. Cadastre SITE_PASSWORD na Vercel e publique de novo.' });
  }
  const senha = req.body && req.body.senha;
  if (!senhaConfere(senha)) {
    await new Promise(r => setTimeout(r, 600));
    return res.status(401).json({ erro: 'Senha incorreta.' });
  }
  res.setHeader('Set-Cookie', cookieSessao());
  return res.status(200).json({ ok: true });
};

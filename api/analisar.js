const { autenticado } = require('./_auth');

const MODELO = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const TIPOS = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

function extrairJSON(texto) {
  const limpo = texto.replace(/```json|```/g, '').trim();
  const i = limpo.indexOf('{'), j = limpo.lastIndexOf('}');
  if (i < 0 || j < i) throw new Error('A resposta não veio em JSON.');
  return JSON.parse(limpo.slice(i, j + 1));
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido.' });
  if (!autenticado(req)) return res.status(401).json({ erro: 'login' });
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ erro: 'A chave da Anthropic não foi cadastrada. Adicione ANTHROPIC_API_KEY na Vercel e publique de novo.' });
  }

  const { prompt, imagens } = req.body || {};
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 200000) {
    return res.status(400).json({ erro: 'Pedido inválido.' });
  }
  const imgs = Array.isArray(imagens) ? imagens.slice(0, 6) : [];
  for (const im of imgs) {
    if (!im || !TIPOS.includes(im.media_type) || typeof im.data !== 'string') {
      return res.status(400).json({ erro: 'Formato de imagem não aceito. Use PNG ou JPG.' });
    }
  }

  const content = [
    ...imgs.map(im => ({ type: 'image', source: { type: 'base64', media_type: im.media_type, data: im.data } })),
    { type: 'text', text: prompt },
  ];

  const headers = {
    'content-type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  };
  if (process.env.ANTHROPIC_WORKSPACE_ID) headers['anthropic-workspace-id'] = process.env.ANTHROPIC_WORKSPACE_ID;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({ model: MODELO, max_tokens: 8000, messages: [{ role: 'user', content }] }),
    });
    const corpo = await r.json().catch(() => ({}));
    if (!r.ok) {
      const detalhe = String((corpo.error && corpo.error.message) || '').slice(0, 300);
      console.error('Erro na API da Anthropic:', r.status, detalhe);
      let erro;
      if (r.status === 401) erro = 'A chave da Anthropic é inválida ou foi desativada. Confira ANTHROPIC_API_KEY na Vercel.';
      else if (r.status === 429) erro = 'Muitos pedidos ao mesmo tempo, ou o limite de gasto foi atingido. Espere um pouco e tente de novo.';
      else if (/credit balance/i.test(detalhe)) erro = 'Os créditos da Anthropic acabaram. Adicione créditos no console da Anthropic.';
      else if (/workspace/i.test(detalhe)) erro = 'A chave da Anthropic não pertence a um espaço de trabalho. Use uma chave com escopo "Espaço de trabalho padrão".';
      else if (r.status === 404 && /model/i.test(detalhe)) erro = `O modelo "${MODELO}" não está disponível para esta chave. Ajuste ANTHROPIC_MODEL na Vercel.`;
      else erro = `O Claude não conseguiu responder agora. Tente de novo em instantes. (Detalhe técnico: ${r.status} ${detalhe})`;
      return res.status(502).json({ erro });
    }
    const texto = (corpo.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
    let dados;
    try { dados = extrairJSON(texto); }
    catch (e) { return res.status(502).json({ erro: 'O Claude respondeu num formato inesperado. Tente de novo.' }); }
    return res.status(200).json({ dados });
  } catch (e) {
    console.error('Falha ao chamar a Anthropic:', e);
    return res.status(502).json({ erro: 'Não foi possível falar com o Claude agora. Tente de novo em instantes.' });
  }
};

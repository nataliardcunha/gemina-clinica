// ===== DADOS DA CLÍNICA: edite aqui especialidades e médicos =====
const ESPECIALIDADES = [
  { id: 'geral', nome: 'Clínica Geral', medico: 'Dr(a). [nome do médico]', desc: 'Check-ups, queixas do dia a dia e encaminhamentos.' },
  { id: 'pediatria', nome: 'Pediatria', medico: 'Dr(a). [nome do médico]', desc: 'Acompanhamento da saúde de crianças e adolescentes.' },
  { id: 'dermato', nome: 'Dermatologia', medico: 'Dr(a). [nome do médico]', desc: 'Cuidados com a pele, os cabelos e as unhas.' },
];
const DURACAO = 50;            // minutos por consulta
const INICIO = 8 * 60, FIM = 18 * 60; // 8h às 18h
const DIAS_A_FRENTE = 14;
const KEY = 'gemina_consultas';

const $ = (id) => document.getElementById(id);
const sel = { esp: null, data: null, hora: null };
const ler = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
const salvar = (l) => { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch {} };
const pad = (n) => String(n).padStart(2, '0');
const hm = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const br = (s) => s.split('-').reverse().join('/');
const nomeEsp = (id) => ESPECIALIDADES.find((e) => e.id === id).nome;

function botao(texto, onclick, pressed, disabled) {
  const b = document.createElement('button');
  b.type = 'button'; b.textContent = texto; b.disabled = !!disabled;
  b.setAttribute('aria-pressed', !!pressed); b.onclick = onclick;
  return b;
}

function cardsEspecialidades() {
  $('especialidades').innerHTML = ESPECIALIDADES.map((e) =>
    `<article><h3>${e.nome}</h3><p>${e.desc}</p><p><strong>${e.medico}</strong></p></article>`).join('');
}

function desenhaEsp() {
  const c = $('optEsp'); c.innerHTML = '';
  ESPECIALIDADES.forEach((e) => c.append(botao(e.nome, () => { sel.esp = e.id; sel.data = sel.hora = null; desenha(); }, sel.esp === e.id)));
}

function desenhaDatas() {
  const c = $('optData'); c.innerHTML = '';
  if (!sel.esp) { c.innerHTML = '<p class="hint">Escolha uma especialidade primeiro.</p>'; return; }
  const d = new Date(); d.setHours(0, 0, 0, 0);
  for (let i = 0, n = 0; n < DIAS_A_FRENTE; i++) {
    const x = new Date(d); x.setDate(d.getDate() + i);
    if (x.getDay() === 0 || x.getDay() === 6) continue; // só segunda a sexta
    n++;
    const dia = x.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
    c.append(botao(dia, () => { sel.data = iso(x); sel.hora = null; desenha(); }, sel.data === iso(x)));
  }
}

function desenhaHoras() {
  const c = $('optHora'); c.innerHTML = '';
  if (!sel.data) { c.innerHTML = '<p class="hint">Escolha uma data primeiro.</p>'; return; }
  const ocupados = ler().filter((x) => x.esp === sel.esp && x.data === sel.data).map((x) => x.hora);
  const agora = new Date();
  for (let m = INICIO; m + DURACAO <= FIM; m += DURACAO) {
    const h = hm(m);
    const passou = new Date(`${sel.data}T${h}`) < agora;
    c.append(botao(h, () => { sel.hora = h; desenha(); }, sel.hora === h, ocupados.includes(h) || passou));
  }
}

function desenhaConfirma() {
  const f = $('confirma');
  f.hidden = !sel.hora;
  if (sel.hora) $('resumo').textContent = `${nomeEsp(sel.esp)}, ${br(sel.data)} às ${sel.hora}.`;
}

function desenhaLista() {
  const l = ler().sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
  const c = $('lista');
  if (!l.length) { c.innerHTML = '<p class="hint">Você ainda não tem consultas. Agende a primeira na seção acima.</p>'; return; }
  c.innerHTML = '';
  l.forEach((x) => {
    const div = document.createElement('div'); div.className = 'item';
    div.innerHTML = `<div><strong>${nomeEsp(x.esp)}</strong><small>${br(x.data)} às ${x.hora} · ${x.nome}</small></div>`;
    div.append(botao('Cancelar consulta', () => cancelar(x), false, false));
    c.append(div);
  });
}

function cancelar(x) {
  const horas = (new Date(`${x.data}T${x.hora}`) - new Date()) / 36e5;
  if (horas < 24) { $('msg').textContent = 'Só é possível cancelar com pelo menos 24h de antecedência.'; return; }
  salvar(ler().filter((y) => !(y.esp === x.esp && y.data === x.data && y.hora === x.hora)));
  $('msg').textContent = 'Consulta cancelada. A vaga voltou para a agenda.';
  desenha();
}

$('confirma').addEventListener('submit', (e) => {
  e.preventDefault();
  const l = ler();
  if (l.some((x) => x.esp === sel.esp && x.data === sel.data && x.hora === sel.hora)) { $('msg').textContent = 'Esse horário acabou de ser ocupado. Escolha outro.'; desenha(); return; }
  l.push({ esp: sel.esp, data: sel.data, hora: sel.hora, nome: $('nome').value, email: $('email').value });
  salvar(l);
  $('msg').textContent = `Consulta confirmada: ${nomeEsp(sel.esp)}, ${br(sel.data)} às ${sel.hora}.`;
  sel.hora = null; e.target.reset(); desenha();
});

function desenha() { desenhaEsp(); desenhaDatas(); desenhaHoras(); desenhaConfirma(); desenhaLista(); }
cardsEspecialidades(); desenha();

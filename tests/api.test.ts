import request from 'supertest';
import { criarApp } from '../src/app';
import { montarFacade } from '../src/montagem';

let app: ReturnType<typeof criarApp>;
const valida = () => ({
  tutor: 'Ana',
  telefone: '31999990000',
  pet: 'Thor',
  tipo: 'CONSULTA',
  dataHora: new Date(Date.now() + 86400000 * 3).toISOString(),
});

beforeEach(() => {
  app = criarApp(montarFacade());
});

test('cria consulta', async () => {
  const r = await request(app).post('/consultas').send(valida());
  expect(r.status).toBe(201);
  expect(r.body.valor).toBe(120);
});

test('ignora extras', async () => {
  const r = await request(app)
    .post('/consultas')
    .send({ ...valida(), valor: 0, status: 'CANCELADA' });
  expect(r.status).toBe(201);
  expect(r.body.valor).toBe(120);
  expect(r.body.status).toBe('AGENDADA');
});

test.each(['123456789', '123456789012'])(
  'telefone inválido %s',
  async (telefone) => {
    expect(
      (
        await request(app)
          .post('/consultas')
          .send({ ...valida(), telefone })
      ).status,
    ).toBe(400);
  },
);

test.each(['1234567890', '12345678901'])(
  'telefone válido %s',
  async (telefone) => {
    expect(
      (
        await request(app)
          .post('/consultas')
          .send({ ...valida(), telefone })
      ).status,
    ).toBe(201);
  },
);

test('tipo inválido', async () => {
  expect(
    (
      await request(app)
        .post('/consultas')
        .send({ ...valida(), tipo: 'TOSA' })
    ).status,
  ).toBe(400);
});

test('data passada', async () => {
  expect(
    (
      await request(app)
        .post('/consultas')
        .send({ ...valida(), dataHora: '2000-01-01T00:00:00Z' })
    ).status,
  ).toBe(400);
});

test('corpo vazio', async () => {
  const r = await request(app).post('/consultas').send({});
  expect(r.status).toBe(400);
  expect(r.body.erros.length).toBeGreaterThan(1);
});

test('GET inexistente', async () => {
  expect((await request(app).get('/consultas/999')).status).toBe(404);
});

test('GET id inválido', async () => {
  expect((await request(app).get('/consultas/abc')).status).toBe(400);
});

test('GET lista e item', async () => {
  const r = await request(app).post('/consultas').send(valida());
  expect((await request(app).get('/consultas')).body).toHaveLength(1);
  expect((await request(app).get('/consultas/' + r.body.id)).status).toBe(200);
});

test('DELETE duas vezes', async () => {
  const r = await request(app).post('/consultas').send(valida());
  const rota = '/consultas/' + r.body.id;
  const c = await request(app).delete(rota);
  expect(c.status).toBe(200);
  expect(c.body.taxaCancelamento).toBe(0);
  expect((await request(app).delete(rota)).status).toBe(409);
});

test('DELETE inexistente', async () => {
  expect((await request(app).delete('/consultas/999')).status).toBe(404);
});

test('tutor com dois caracteres é inválido', async () => {
  const r = await request(app)
    .post('/consultas')
    .send({ ...valida(), tutor: 'Al' });
  expect(r.status).toBe(400);
});

test('tutor com três caracteres e Pet+ válido', async () => {
  const r = await request(app)
    .post('/consultas')
    .send({ ...valida(), tutor: 'Ana', planoPetMais: true });
  expect(r.status).toBe(201);
  expect(r.body.valor).toBe(96);
});

test('data impossível é rejeitada', async () => {
  const ano = new Date().getFullYear() + 1;
  const r = await request(app)
    .post('/consultas')
    .send({ ...valida(), dataHora: `${ano}-02-30T14:00:00Z` });
  expect(r.status).toBe(400);
});

test('plano não booleano é rejeitado', async () => {
  const r = await request(app)
    .post('/consultas')
    .send({ ...valida(), planoPetMais: 'true' });
  expect(r.status).toBe(400);
});

test('banho e tosa cadastrado na API', async () => {
  const r = await request(app)
    .post('/consultas')
    .send({ ...valida(), tipo: 'BANHO_TOSA' });
  expect(r.status).toBe(201);
  expect(r.body.valor).toBe(65);
});

test('JSON malformado retorna 400 com mensagem de validação', async () => {
  const resposta = await request(app)
    .post('/consultas')
    .set('Content-Type', 'application/json')
    .send('{"tutor":');

  expect(resposta.status).toBe(400);
  expect(resposta.body).toEqual({ erros: ['JSON inválido'] });
});

test('cancelamento próximo aplica a taxa sobre o preço com Pet+', async () => {
  const umaHoraMs = 60 * 60 * 1000;
  const criada = await request(app)
    .post('/consultas')
    .send({
      ...valida(),
      dataHora: new Date(Date.now() + umaHoraMs).toISOString(),
      planoPetMais: true,
    });
  expect(criada.status).toBe(201);

  const rota = `/consultas/${criada.body.id}`;
  const cancelada = await request(app).delete(rota);

  expect(cancelada.status).toBe(200);
  expect(cancelada.body).toMatchObject({
    status: 'CANCELADA',
    valor: 96,
    taxaCancelamento: 24,
  });
  
  expect((await request(app).get(rota)).body).toEqual(cancelada.body);
});

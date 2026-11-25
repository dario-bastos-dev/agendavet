import express, { Request, Response, NextFunction } from 'express';
import { ClinicaFacade, ConsultaInexistente, ConsultaJaCancelada } from './facade/ClinicaFacade';
import { TipoAtendimento } from './domain/TipoAtendimento';
function dataISO(valor: unknown): Date | null {
 if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})?$/.test(valor)) return null;
 const [ano, mes, dia] = valor.slice(0,10).split('-').map(Number);
 const calendario = new Date(0); calendario.setUTCFullYear(ano, mes-1, dia);
 if (calendario.getUTCMonth() !== mes-1 || calendario.getUTCDate() !== dia) return null;
 if (Number(valor.slice(11,13)) > 23 || Number(valor.slice(14,16)) > 59 || Number(valor.slice(17,19)) > 59) return null;
 const data = new Date(valor); return Number.isFinite(data.getTime()) ? data : null;
}
export function criarApp(facade: ClinicaFacade) {
 const app = express(); app.use(express.json());
 app.post('/consultas', (req, res) => {
  const corpo = req.body ?? {}; const erros: string[] = [];
  const { tutor, telefone, pet, tipo, dataHora, planoPetMais = false } = corpo;
  const data = dataISO(dataHora);
  if (typeof tutor !== 'string' || tutor.trim().length < 3) erros.push('Tutor deve ter 3 ou mais caracteres');
  if (typeof telefone !== 'string' || !/^\d{10,11}$/.test(telefone)) erros.push('Telefone deve ter 10 ou 11 dígitos');
  if (typeof pet !== 'string' || !pet.trim()) erros.push('Pet obrigatório');
  if (!Object.values(TipoAtendimento).includes(tipo)) erros.push('Tipo inválido');
  if (!data || data.getTime() <= Date.now()) erros.push('Data ISO válida e futura obrigatória');
  if (typeof planoPetMais !== 'boolean') erros.push('Plano deve ser booleano');
  if (erros.length || !data) { res.status(400).json({ erros }); return; }
  res.status(201).json(facade.agendar({ tutor: tutor.trim(), telefone, pet: pet.trim(), tipo, dataHora: data, planoPetMais }));
 });
 app.get('/consultas', (_req, res) => { res.json(facade.listar()); });
 app.param('id', (req, res, next, valor) => { if (!/^\d+$/.test(valor) || !Number.isSafeInteger(Number(valor)) || Number(valor) <= 0) { res.status(400).json({ erros: ['ID inválido'] }); return; } next(); });
 app.get('/consultas/:id', (req, res) => { res.json(facade.buscarPorId(Number(req.params.id))); });
 app.delete('/consultas/:id', (req, res) => { res.json(facade.cancelar(Number(req.params.id))); });
 app.use((erro: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (erro instanceof ConsultaInexistente) { res.status(404).json({ erros: [erro.message] }); return; }
  if (erro instanceof ConsultaJaCancelada) { res.status(409).json({ erros: [erro.message] }); return; }
  if (erro instanceof SyntaxError) { res.status(400).json({ erros: ['JSON inválido'] }); return; }
  res.status(500).json({ erros: ['Erro interno'] });
 });
 return app;
}

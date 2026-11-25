import { Consulta, NovaConsulta } from '../domain/Consulta';
import { IRepositorioConsultas } from '../repositories/IRepositorioConsultas';
import { INotificador } from '../notifications/INotificador';
import { CalculadoraDePreco } from '../pricing/CalculadoraDePreco';
import { CalculadoraDeTaxaCancelamento } from '../pricing/CalculadoraDeTaxaCancelamento';
export class ConsultaInexistente extends Error {}
export class ConsultaJaCancelada extends Error {}
// Compatibilidade com o construtor de três argumentos do roteiro.
// A composição da API continua injetando explicitamente a calculadora de taxas.
const taxasPadrao = new CalculadoraDeTaxaCancelamento();
export class ClinicaFacade {
 constructor(private readonly repositorio: IRepositorioConsultas, private readonly calculadora: CalculadoraDePreco, private readonly notificador: INotificador, private readonly taxas: CalculadoraDeTaxaCancelamento = taxasPadrao) {}
 agendar(dados: NovaConsulta): Consulta {
  if (!dados.tutor?.trim() || !dados.telefone?.trim() || !dados.pet?.trim()) throw new Error('Campos obrigatórios');
  if (!(dados.dataHora instanceof Date) || !Number.isFinite(dados.dataHora.getTime())) throw new Error('Data inválida');
  const valor = this.calculadora.calcular(dados.tipo, dados.planoPetMais);
  const consulta = this.repositorio.salvar({ ...dados, valor, status: 'AGENDADA' });
  const data = dados.dataHora.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '');
  this.notificador.enviar(dados.telefone, `Olá ${dados.tutor}! A consulta do ${dados.pet} foi agendada para ${data}. Valor: R$ ${valor.toFixed(2).replace('.', ',')}`);
  return consulta;
 }
 buscarPorId(id: number): Consulta { const consulta = this.repositorio.buscarPorId(id); if (!consulta) throw new ConsultaInexistente('Consulta não encontrada'); return consulta; }
 cancelar(id: number, agora = new Date()): Consulta {
  const consulta = this.buscarPorId(id);
  if (consulta.status === 'CANCELADA') throw new ConsultaJaCancelada('Consulta já cancelada');
  const cancelada: Consulta = { ...consulta, status: 'CANCELADA', taxaCancelamento: this.taxas.calcular(consulta.valor, consulta.dataHora, agora, consulta.planoPetMais) };
  this.repositorio.atualizar(cancelada); return cancelada;
 }
 listar(): Consulta[] { return this.repositorio.listar(); }
}

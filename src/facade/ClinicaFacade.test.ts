import { ClinicaFacade } from './ClinicaFacade';
import { RepositorioEmMemoria } from '../repositories/RepositorioEmMemoria';
import { CalculadoraDePreco } from '../pricing/CalculadoraDePreco';
import { CalculadoraDeTaxaCancelamento } from '../pricing/CalculadoraDeTaxaCancelamento';
import { PrecoConsulta } from '../pricing/regras';
import { TipoAtendimento } from '../domain/TipoAtendimento';
const notificador = { enviar: jest.fn() };
let facade: ClinicaFacade;
const dados = { tutor:'Ana', telefone:'31999990000', pet:'Thor', tipo:TipoAtendimento.CONSULTA, dataHora:new Date(Date.now() + 3 * 86400000), planoPetMais:false };
beforeEach(() => { jest.clearAllMocks(); facade = new ClinicaFacade(new RepositorioEmMemoria(),new CalculadoraDePreco([new PrecoConsulta()]),notificador,new CalculadoraDeTaxaCancelamento()); });
test('notifica uma vez', () => { facade.agendar(dados); expect(notificador.enviar).toHaveBeenCalledTimes(1); expect(notificador.enviar).toHaveBeenCalledWith(dados.telefone,expect.stringContaining('Thor')); });
test.each(['tutor','telefone','pet'] as const)('não notifica com %s vazio', campo => { expect(() => facade.agendar({...dados,[campo]:''})).toThrow(); expect(notificador.enviar).not.toHaveBeenCalled(); });
test('Pet+', () => expect(facade.agendar({...dados,planoPetMais:true}).valor).toBe(96));
test('inexistente', () => expect(() => facade.cancelar(999)).toThrow('Consulta não encontrada'));
test('cancelamento e conflito', () => { const c=facade.agendar(dados); const r=facade.cancelar(c.id,dados.dataHora); expect(r.taxaCancelamento).toBe(120); expect(facade.listar()[0].status).toBe('CANCELADA'); expect(() => facade.cancelar(c.id)).toThrow('Consulta já cancelada'); });
test('data inválida', () => expect(() => facade.agendar({...dados,dataHora:new Date(NaN)})).toThrow());
test('data com tipo incorreto', () => expect(() => facade.agendar({...dados,dataHora:null as unknown as Date})).toThrow());

test('construtor do roteiro aceita três dependências', () => {
 const compat = new ClinicaFacade(new RepositorioEmMemoria(), new CalculadoraDePreco([new PrecoConsulta()]), notificador);
 const consulta = compat.agendar(dados);
 expect(compat.cancelar(consulta.id, dados.dataHora).taxaCancelamento).toBe(120);
});

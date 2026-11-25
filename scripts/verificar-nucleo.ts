// Verificação independente de Express e Jest. Não mede cobertura.
import { CalculadoraDePreco } from '../src/pricing/CalculadoraDePreco';
import { CalculadoraDeTaxaCancelamento } from '../src/pricing/CalculadoraDeTaxaCancelamento';
import { PrecoConsulta, PrecoVacina, PrecoCirurgia, PrecoBanhoTosa } from '../src/pricing/regras';
import { TipoAtendimento as T } from '../src/domain/TipoAtendimento';
import { ClinicaFacade } from '../src/facade/ClinicaFacade';
import { RepositorioEmMemoria } from '../src/repositories/RepositorioEmMemoria';
import { ZapAdapter } from '../src/notifications/ZapAdapter';
import { ZapLegacySDK } from '../src/libs/zap-legacy-sdk';
let aprovados = 0;
function igual(nome: string, resultado: unknown, esperado: unknown) {
 if (resultado !== esperado) throw new Error(`${nome}: esperado ${esperado}, recebido ${resultado}`);
 aprovados++; console.log(`OK - ${nome}`);
}
function erro(nome: string, executar: () => unknown, mensagem: string) {
 try { executar(); } catch (e) { igual(nome, (e as Error).message, mensagem); return; }
 throw new Error(`${nome}: deveria lançar erro`);
}
const precos = new CalculadoraDePreco([new PrecoConsulta(), new PrecoVacina(), new PrecoCirurgia(), new PrecoBanhoTosa()]);
for (const [tipo, normal, plano] of [[T.CONSULTA,120,96],[T.VACINA,80,64],[T.CIRURGIA,540,432],[T.BANHO_TOSA,65,52]] as const) {
 igual(`${tipo} normal`,precos.calcular(tipo),normal); igual(`${tipo} Pet+`,precos.calcular(tipo,true),plano);
}
const taxas = new CalculadoraDeTaxaCancelamento();
const inicio = new Date('2027-01-10T14:00:00Z');
const antes = (min: number) => new Date(inicio.getTime() - min * 60000);
for (const [min, plano, esperado] of [[2880,false,0],[1440,false,0],[1439,false,36],[120,false,36],[119,false,60],[0,false,120],[60,true,30],[-1,false,120]] as const) {
 igual(`taxa ${min} min Pet+ ${plano}`, taxas.calcular(120,inicio,antes(min),plano),esperado);
}
for (const v of [0,-1,NaN]) erro(`valor inválido ${v}`,()=>taxas.calcular(v,inicio,antes(60),false),'Valor inválido');
erro('data inválida',()=>taxas.calcular(120,new Date(NaN),inicio,false),'Data inválida');
let chamadas = 0;
const notificador = { enviar: (_telefone: string, _mensagem: string) => { chamadas++; } };
const facade = new ClinicaFacade(new RepositorioEmMemoria(),precos,notificador);
const dados = { tutor:'Ana', telefone:'31999990000', pet:'Thor', tipo:T.CONSULTA, dataHora:inicio, planoPetMais:true };
const consulta = facade.agendar(dados);
igual('valor agendado Pet+',consulta.valor,96);
igual('notificação única',chamadas,1);
erro('campos obrigatórios',()=>facade.agendar({...dados,pet:''}),'Campos obrigatórios');
igual('não notifica dados inválidos',chamadas,1);
igual('consulta persistida',facade.buscarPorId(consulta.id).id,consulta.id);
const cancelada = facade.cancelar(consulta.id,antes(60));
igual('taxa sobre o valor com Pet+',cancelada.taxaCancelamento,24);
igual('status persistido',facade.listar()[0].status,'CANCELADA');
erro('cancelamento duplicado',()=>facade.cancelar(consulta.id),'Consulta já cancelada');
erro('consulta inexistente',()=>facade.cancelar(999),'Consulta não encontrada');
class SDKTeste extends ZapLegacySDK {
 constructor(private readonly sucesso: boolean) { super('TESTE'); }
 dispararMsg(numero: string, payload: {txt: string}) {
  igual('DDI do adapter',numero,'5531999990000'); igual('payload do adapter',payload.txt,'Teste');
  return {ok:this.sucesso};
 }
}
new ZapAdapter(new SDKTeste(true)).enviar('31999990000','Teste');
erro('falha da SDK',()=>new ZapAdapter(new SDKTeste(false)).enviar('31999990000','Teste'),'Falha ao notificar');
console.log(`TOTAL: ${aprovados} verificações aprovadas.`);

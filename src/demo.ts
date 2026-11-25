import { montarFacade } from './montagem';
import { TipoAtendimento } from './domain/TipoAtendimento';
const facade = montarFacade();
for (const [tipo, planoPetMais] of [[TipoAtendimento.CONSULTA, false], [TipoAtendimento.VACINA, true], [TipoAtendimento.BANHO_TOSA, false]] as const) {
 console.log(facade.agendar({ tutor: 'Ana', telefone: '31999990000', pet: 'Thor', tipo, planoPetMais, dataHora: new Date(Date.now() + 86400000 * 2) }));
}

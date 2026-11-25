import { TipoAtendimento } from '../domain/TipoAtendimento';
import { RegraDePreco } from './RegraDePreco';
const VALOR_CONSULTA = 120;
const VALOR_VACINA = 80;
const VALOR_CIRURGIA = 540;
const VALOR_BANHO_TOSA = 65;

export class PrecoConsulta implements RegraDePreco { readonly tipo = TipoAtendimento.CONSULTA; calcular(): number { return VALOR_CONSULTA; } }
export class PrecoVacina implements RegraDePreco { readonly tipo = TipoAtendimento.VACINA; calcular(): number { return VALOR_VACINA; } }
export class PrecoCirurgia implements RegraDePreco { readonly tipo = TipoAtendimento.CIRURGIA; calcular(): number { return VALOR_CIRURGIA; } }
export class PrecoBanhoTosa implements RegraDePreco { readonly tipo = TipoAtendimento.BANHO_TOSA; calcular(): number { return VALOR_BANHO_TOSA; } }

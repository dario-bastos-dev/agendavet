import { CalculadoraDePreco } from './CalculadoraDePreco';
import { PrecoConsulta, PrecoVacina, PrecoCirurgia, PrecoBanhoTosa } from './regras';
import { DescontoPlanoPet } from './DescontoPlanoPet';
import { TipoAtendimento as T } from '../domain/TipoAtendimento';
const calc = new CalculadoraDePreco([new PrecoConsulta(),new PrecoVacina(),new PrecoCirurgia(),new PrecoBanhoTosa()]);
test.each([[T.CONSULTA,120],[T.VACINA,80],[T.CIRURGIA,540],[T.BANHO_TOSA,65]] as const)('preço %s', (tipo,valor) => expect(calc.calcular(tipo)).toBe(valor));
test('desconto', () => { const d = new DescontoPlanoPet(new PrecoConsulta()); expect(d.tipo).toBe(T.CONSULTA); expect(d.calcular()).toBe(96); expect(calc.calcular(T.CONSULTA,true)).toBe(96); });
test('sem regra', () => expect(() => new CalculadoraDePreco([]).calcular(T.CONSULTA)).toThrow());

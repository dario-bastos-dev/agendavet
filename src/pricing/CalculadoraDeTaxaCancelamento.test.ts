import { CalculadoraDeTaxaCancelamento } from './CalculadoraDeTaxaCancelamento';
const calc = new CalculadoraDeTaxaCancelamento();
const inicio = new Date('2027-01-10T14:00:00');
const antes = (min: number) => new Date(inicio.getTime() - min * 60000);
test.each([[2880,false,0],[1440,false,0],[1439,false,36],[120,false,36],[119,false,60],[0,false,120],[60,true,30],[-1,false,120]] as const)('antecedência %i, Pet+ %s, taxa %i', (min, plano, taxa) => { expect(calc.calcular(120,inicio,antes(min),plano)).toBe(taxa); });
test('valor zero', () => expect(() => calc.calcular(0,inicio,antes(2880),false)).toThrow('Valor inválido'));
test('valor não finito', () => expect(() => calc.calcular(NaN,inicio,antes(1),false)).toThrow('Valor inválido'));
test('data inválida', () => expect(() => calc.calcular(120,new Date(NaN),inicio,false)).toThrow('Data inválida'));

test('valor negativo', () => expect(() => calc.calcular(-1,inicio,antes(2880),false)).toThrow('Valor inválido'));

const HORA_MS = 60 * 60 * 1000;
const LIMITE_SEM_TAXA = 24;
const LIMITE_TAXA_INTERMEDIARIA = 2;
const TAXA_ISENTA = 0;
const TAXA_INTERMEDIARIA = 0.3;
const TAXA_TARDIA = 0.5;
const TAXA_INTEGRAL = 1;
const FATOR_PET_MAIS = 0.5;
const CENTAVOS_POR_REAL = 100;

export class CalculadoraDeTaxaCancelamento {
 calcular(valor: number, inicio: Date, momentoCancelamento: Date, planoPetMais: boolean): number {
  if (!Number.isFinite(valor) || valor <= 0) throw new Error('Valor inválido');
  const horas = (inicio.getTime() - momentoCancelamento.getTime()) / HORA_MS;
  if (!Number.isFinite(horas)) throw new Error('Data inválida');
  const percentual = horas >= LIMITE_SEM_TAXA ? TAXA_ISENTA
   : horas >= LIMITE_TAXA_INTERMEDIARIA ? TAXA_INTERMEDIARIA
   : horas > 0 ? TAXA_TARDIA : TAXA_INTEGRAL;
  const taxa = valor * percentual * (planoPetMais ? FATOR_PET_MAIS : 1);
  return Math.round(taxa * CENTAVOS_POR_REAL) / CENTAVOS_POR_REAL;
 }
}

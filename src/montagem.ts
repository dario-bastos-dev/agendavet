import { ClinicaFacade } from './facade/ClinicaFacade';
import { RepositorioEmMemoria } from './repositories/RepositorioEmMemoria';
import { CalculadoraDePreco } from './pricing/CalculadoraDePreco';
import { CalculadoraDeTaxaCancelamento } from './pricing/CalculadoraDeTaxaCancelamento';
import { PrecoConsulta, PrecoVacina, PrecoCirurgia, PrecoBanhoTosa } from './pricing/regras';
import { ZapAdapter } from './notifications/ZapAdapter';
import { ZapLegacySDK } from './libs/zap-legacy-sdk';
export function montarFacade() { return new ClinicaFacade(new RepositorioEmMemoria(), new CalculadoraDePreco([new PrecoConsulta(), new PrecoVacina(), new PrecoCirurgia(), new PrecoBanhoTosa()]), new ZapAdapter(new ZapLegacySDK('TOKEN-123')), new CalculadoraDeTaxaCancelamento()); }

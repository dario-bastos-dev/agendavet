import { INotificador } from './INotificador';
import { ZapLegacySDK } from '../libs/zap-legacy-sdk';
export class ZapAdapter implements INotificador {
 constructor(private readonly sdk: ZapLegacySDK) {}
 enviar(telefone: string, mensagem: string): void {
  if (!this.sdk.dispararMsg('55' + telefone, { txt: mensagem }).ok) throw new Error('Falha ao notificar');
 }
}

// src/libs/zap-legacy-sdk.ts  (biblioteca de terceiros — NÃO ALTERAR)
export class ZapLegacySDK {
  constructor(private token: string) {}
 
  dispararMsg(numeroComDDI: string, payload: { txt: string }): { ok: boolean } {
    console.log(`[ZAP ${this.token}] -> ${numeroComDDI}: ${payload.txt}`);
    return { ok: true };
  }
}

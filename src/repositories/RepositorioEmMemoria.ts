import { Consulta } from '../domain/Consulta';
import { IRepositorioConsultas } from './IRepositorioConsultas';
export class RepositorioEmMemoria implements IRepositorioConsultas {
 private readonly consultas = new Map<number, Consulta>();
 private proximoId = 1;
 salvar(consulta: Omit<Consulta, 'id'>): Consulta { const registro = { ...consulta, id: this.proximoId++ }; this.consultas.set(registro.id, registro); return registro; }
 buscarPorId(id: number): Consulta | undefined { return this.consultas.get(id); }
 atualizar(consulta: Consulta): void { this.consultas.set(consulta.id, consulta); }
 listar(): Consulta[] { return [...this.consultas.values()]; }
}

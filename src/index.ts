import { criarApp } from './app';
import { montarFacade } from './montagem';
criarApp(montarFacade()).listen(3000, () => console.log('AgendaVet em http://localhost:3000'));

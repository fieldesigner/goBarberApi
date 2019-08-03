/* ARQUIVO DE FILA SEPARADO PARA RODAR SEPARADAMENTE DA APLICAÇÃO */
import 'dotenv/config'; // variaveis de ambiente que esta na raiz no arquivo .env
import Queue from './lib/Queue';
Queue.processQueue();


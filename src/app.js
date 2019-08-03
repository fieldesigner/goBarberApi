import 'dotenv/config'; // variaveis de ambiente que esta na raiz no arquivo .env

import express from 'express';
import path from 'path';

import cors from 'cors';

import Youch from 'youch';
import * as Sentry from '@sentry/node';
import sentryConfig from './config/sentry';
import 'express-async-errors';

import routes from './routes';




import './database';

class App{
  constructor(){
    this.server = express();
    Sentry.init(sentryConfig); // iniciando monitoramento de erros
    this.middlewares();
    this.routes();
    this.exceptionHandler();
  }

  middlewares(){
    this.server.use(Sentry.Handlers.requestHandler()); // linha obrigatoria antes de tudo
    this.server.use(cors())
    this.server.use(express.json());
    this.server.use(
      '/files', 
      express.static(path.resolve(__dirname, '..', 'tmp', 'uploads'))
      );
  }

  routes(){
    this.server.use(routes);
    this.server.use(Sentry.Handlers.errorHandler()); // linha obrigatoria depois das rotas
  }
  // middleware de tratamento de erros
  exceptionHandler(){
    this.server.use( async (err, req, res, next) => {

      if(process.env.NODE_ENV == 'development'){
        const errors = await new Youch( err, req).toJSON();
        return res.status(500).json(errors);
      }
      return res.status(500).json({ error: 'Erro interno de servidor' });
    });
  }
}
export default new App().server;
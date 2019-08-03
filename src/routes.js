import { Router } from 'express';

import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import ProviderController from './app/controllers/ProviderController';
import AppointmentController from './app/controllers/AppointmentController';
import ScheduleController from './app/controllers/ScheduleController';
import NotificationController from './app/controllers/NotificationController';
import AvaiableController from './app/controllers/AvaiableController';

import authMiddleware from './app/middlewares/auth'



const routes = new Router();
const upload = multer(multerConfig);
// cadastro de usuario
routes.post('/users', UserController.store);

// loginde usuario
routes.post('/sessions', SessionController.store);

// autenticação do token através do middleware de autenticação
routes.use(authMiddleware); // rotas abaixo todas tem que passar pela autenticação

// atualização de usuario
routes.put('/users', UserController.update);

// listagem de prestadores de serviço
routes.get('/providers', ProviderController.index);
routes.get('/providers/:providerId/avaiable', AvaiableController.index);

// listagen e agendamento de serviço usuario normal
routes.get('/appointments', AppointmentController.index);
routes.post('/appointments', AppointmentController.store);
routes.delete('/appointments/:id', AppointmentController.delete);

// listagem de servicos para os providers
routes.get('/schedule', ScheduleController.index);

// lista de notificações de agendamento pelo mongoose
routes.get('/notifications', NotificationController.index);
routes.put('/notifications/:id', NotificationController.update); // marca como lida ou visto

// rota envio do avatar
routes.post('/files', upload.single('file'), FileController.store);


export default routes;
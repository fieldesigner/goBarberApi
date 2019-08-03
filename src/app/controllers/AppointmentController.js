import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt'


import User from '../models/User';
import Appointment from '../models/Appointment';
import File from '../models/File';

import Notification from '../schemas/Notifications';

import CancellationMail from '../jobs/CancellationMail';
import Queue from '../../lib/Queue';

class AppointmentController {
  // listagem dos agendamentos para usuario comum.
  async index(req, res){
    // para paginação e informando valor padrão 1 caso nao tenha passo a pagina
    const { page = 1 } = req.query;

    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null, },
      order: ['date'],
      limit: 20,
      offset: (page - 1) * 20,
      attributes: ['id', 'date', 'past', 'cancelable'],
      include: [{
        model: User, 
        as: 'provider', 
        attributes: ['id', 'name'],
        include: [{
            model: File,
            as: 'avatar',
            attributes: ['id', 'path', 'url'],
          }],
      }],
    });
    return res.json(appointments);
  }


  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id : Yup.number().required(),
      date: Yup.date().required(),
    });

    if(!(await schema.isValid(req.body))){
      return res.status(400).json({ error: 'Erro de validação' });
    }

    const { provider_id, date } = req.body;

    //verificando se provider_id é de um prestador de serviço (provider = true)
    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    })
    if(!isProvider){
      return res.status(401).json({ error: 'Você não pode agendar com usuário que não é prestador de serviço'})
    }

    if(req.userId == provider_id) {
      return res.status(401).json({ error: 'Você não pode agendar com você mesmo'})
    }

    // parseISO = tranforma a variavel date em formato date do javascript
    // startOfHour = pega a hora inicial ex: 14:15 vai pegar o 14:00

    // verificando se horario de agendamento já passou
    const hourStart = startOfHour(parseISO(date));
    if(isBefore(hourStart, new Date())){
      return res.status(400).json({ error: 'data não permitida '});
    }

    // verificando se agenda já esta cheia para o horario indicado
    const checkAvailability = await Appointment.findOne({
      where : { provider_id, canceled_at: null, date: hourStart, }
    });
    if(checkAvailability){
      return res.status(400).json({ error: 'Horário já agendado' });
    }

    //se chegou até aqui pode agendar: 
    const appointment = await Appointment.create({
      user_id : req.userId,
      provider_id,
      date,
    });

    /* Notificando prestador (provider) atraves do mongoose */

    // pega nome do usuário
    const user = await User.findByPk(req.userId);
    // formatando a data para exibir 
    const formattedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', às' H:mm'h'", { locale: pt}
    );

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formattedDate}`,
      user: provider_id,      
    });

    return res.json(appointment);
  }


  async delete(req, res){
    // buscando os dados do agendamento no banco, com include (JOIN) dados do provider e do usuário que agendou
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: [ 'name', 'email' ],
        },
        {
          model: User,
          as: 'user',
          attributes: [ 'name' ],
        }
      ],
    });

    // comparando user id no agendamento com o user id do usuario logado
    if(appointment.user_id != req.userId){
      return res.status(401).json({
        error: "Você não tem permissão para cancelar este agendamento",
      });
    }

    // reduzindo duas horas do horario agendado.
    const dateWithSub = subHours(appointment.date, 2);
    // verificando se o horario limite (2h) para cancelamento já passou
    if(isBefore(dateWithSub, new Date())){
      return res.status(401).json({
        error: "O prazo máximo para cancelar um agendamento já passou.",
      });
    }

    // se chegou até aqui pode cancelar o agendamento.
    //mudando no banco de dados o campo data do cancelamento;
    appointment.canceled_at = new Date();
    await appointment.save();

    // envia email de aviso do cancelamento
    await Queue.add(CancellationMail.key, {
      appointment,
    });

    return res.json(appointment);
  }

}

export default new AppointmentController();
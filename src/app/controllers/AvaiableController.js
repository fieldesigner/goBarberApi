import { startOfDay, endOfDay, setSeconds, setMinutes, setHours, format, isAfter } from 'date-fns';
import Appointment from '../models/Appointment';
import {Op} from 'sequelize';


class AvaiableController {
  async index (req, res){
    //pegando a data da url ?date=1562764974894
    const { date } = req.query;
    if(!date){
      return res.status(400).json({error: 'data inválida'});      
    }

    // assegurando que o valor seja numérico
    const searchDate = Number(date);

    // buscando agendamentos para a data informada
    const appointments = await Appointment.findAll({
      where:{
        provider_id: req.params.providerId,
        canceled_at: null,
        date: {
          [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
        },
      },
    });

    // setando os horários de atendimentos 
    const schedule = [
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
      '19:00',
      '20:00',
    ];
    // objeto com os horarios disponiveis
    const avaiable = schedule.map( time => {
      /*formata cada horario para YYYY-MM-DD HH:MM:SS a partir da data informada 
      pelo usuario + os horarios de atendimento do schedule*/

      const [ hour, minute ] = time.split(':'); // explode de cada horario de atendimento
      const value = setSeconds(
        setMinutes(setHours(searchDate, hour), minute), 0);

      return{
        time,        
        value: format(value, "yyyy-MM-dd'T'HH:mm:ssxxx"),
        available: isAfter(value, new Date()) // verifica se o horario já passou
        && !appointments.find( a => format(a.date, 'HH:mm') == time), // e se o horário ja esta marcado
      };
    });

    return res.json(avaiable);
  }
}

export default new AvaiableController();
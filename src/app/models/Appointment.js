import Sequelize, { Model } from 'sequelize';
import { isBefore, subHours } from 'date-fns';

class Appointment extends Model{
  static init(sequelize){
    super.init(
      {
        date: Sequelize.DATE,
        canceled_at: Sequelize.DATE,
        // past: variavel virtual para verificação se o horario do agendamento ja passou
        past: {
          type: Sequelize.VIRTUAL,
          get() {
            return isBefore(this.date, new Date());
          }
        },
        // cancelable: variavel vistual que verifica se o agendamento ainda ta no prazo de cancelamento
        cancelable: {
          type: Sequelize.VIRTUAL,
          get() {
            return isBefore(new Date(), subHours(this.date, 2));
          }
        },
      },
      {
        sequelize,
      }
    );
    return this;
  }

  // caso precise relacionar duas vezes com a mesma tabela o as: é obrigatório
  static associate(models){
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    this.belongsTo(models.User, { foreignKey: 'provider_id', as: 'provider' });
  }

}

export default Appointment;
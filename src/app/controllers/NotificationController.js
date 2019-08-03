import User from '../models/User';
import Notification from '../schemas/Notifications';

class NotificationController{
  async index(req, res){
    //verificando se o usuario logado é de um prestador de serviço (provider = true)
    const isProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    })
    if(!isProvider){
      return res.status(401).json({ error: 'Você não é prestador de serviço'});
    }

    const notifications = await Notification.find({
      user: req.userId,
    }).sort({ createdAt: 'desc' }).limit(20);


    return res.json(notifications);
  }

  async update(req, res){
    //const notification = await Notification.findById(req.params.id);
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
        { read: true },
        { new: true }
      );

      return res.json(notification);
  }
}

export default new NotificationController();
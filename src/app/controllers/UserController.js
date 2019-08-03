import * as Yup from 'yup'; // lib para validação dos campos
import User from '../models/User';
import File from '../models/File';

class UserController {
  // CADASTRO DE USUARIO
  async store(req, res){
    // validando os campos do form
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      password: Yup.string().required().min(6),
    });
    if(!(await schema.isValid(req.body))){
      return res.status(400).json({ error: "Erro de validação " })
    }


    // verificando se email já existe no banco
    const userExists = await User.findOne({ where: { email: req.body.email } });
    if(userExists){
      return res.status(400).json({ error: 'Usuário já cadastrado ' });
    }

    // se tiver tudo ok cadastra
    const { id, name, email, provider } = await User.create(req.body);
    return res.json({
      id, 
      name, 
      email, 
      provider,
    });
  }

  // ATUALIZAÇÃO DO USUÁRIO
  async update(req, res) {
    // validando os campos do form para atualização
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string().min(6),
      password: Yup.string().min(6)
      .when('oldPassword', (oldPassword, field) => 
        oldPassword ? field.required() : field
      ),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });

    if(!(await schema.isValid(req.body))){
      return res.status(400).json({ error: "Erro de validação " })
    }


    // pegando informações enviadas pelo user
    const { email, oldPassword } = req.body;
    // pegando informações do user logado
    const user = await User.findByPk(req.userId);

    // verificando se o email passado é diferente do email atual
    if(email != user.email){
      const userExists = await User.findOne({ where: { email } });
      // verificando se já existe um email como o que foi passado.
      if(userExists){
        return res.status(400).json({ error: 'Usuário já cadastrado ' });
      }
    }

    /* verificando se a senha antiga (passada para atualização) 
    é igual a senha do user logado */
    if(oldPassword && !(await user.checkPassword(oldPassword))){
      return res.status(401).json({ error: "Senha antiga incorreta." });
    }

    //const {id, name, provider } = await user.update(req.body);

    await user.update(req.body);
    const { id, name, avatar } = await user.findByPk(req.userId, {
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: [ 'id', 'path', 'url'],
        }
      ]
    });

    return res.json({
      id, 
      name, 
      email,
      avatar,
    });
  }

}

export default new UserController();
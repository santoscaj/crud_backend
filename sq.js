const Sequelize = require('sequelize')
const Model = Sequelize.Model

const sequelize = new Sequelize('postgres://postgres:admin@localhost:5432/crud_db')

class User extends Model {}

User.init({
    firstName: {
      type: Sequelize.STRING,
    },
    lastName: {
      type: Sequelize.STRING
    }
  }, {
    sequelize,
    modelName: 'user'
})

sequelize.sync()


exports.module = {
    User,
    sequelize
}

const Sequelize = require('sequelize')
const Default = require('./data/defaultData')
const Model = Sequelize.Model
const sequelize = new Sequelize('postgres://postgres:admin@localhost:5432/crud_db')
class User extends Model {}
class Telephone extends Model {}

User.init({
    firstName: {  
      type: Sequelize.STRING,
      allowNull: false
    },
    lastName: {
      type: Sequelize.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'user'
})

Telephone.init({
    name: {
      type: Sequelize.STRING, 
      allowNull: false
    },
    number: {
      type: Sequelize.STRING,
      allowNull: false
    },
    user_id:{
      type: Sequelize.INTEGER,
      unique: false,
      allowNull : false, 
      references:{
        model: User, 
        key: 'id',
      }
    }
  },{
    sequelize, 
    modelName:'telephone'
})


User.Telephone = User.hasMany(Telephone, {foreignKey: 'user_id', constraints: false})
Telephone.User = Telephone.belongsTo(User, { foreignKey: 'id', constraints: false})

sequelize.sync()

////////////////// DEFAULT TESTING VALUES
function findOrCreateUser(newUser){
  User.findOrCreate({where: newUser.details})
  .then(user=>{
    for (var telephone of newUser.telephones){
      Telephone.findOrCreate({where: {...telephone,user_id: user[0].dataValues.id}, include: Telephone.User})
    } 
  })
  .catch(e=>console.error(e)) 
  .catch(e=>console.error(e)) 
} 

// async function findOrCreateUser(userDetails, telephoneDetails){
//   try{
//     const user = await User.findOrCreate({where: userDetails})
//     for (var telephone of telephoneDetails){
//       try{
//         await Telephone.findOrCreate({where: {...telephone,user_id: user[0].dataValues.id}})
//       }catch(e){
//         console.error(e)
//       }
//     }
//   }catch(e){
//     console.error(e)
//   }
// }



for (var user of Default.users){
  findOrCreateUser(user)
}

module.exports = {
    User,
    Telephone, 
    sequelize
}
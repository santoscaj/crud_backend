require("@babel/register");
const Koa = require('koa');
const json = require('koa-json');
const cors = require('@koa/cors')
const KoaRouter = require('koa-router');
const BodyParser = require('koa-bodyparser');
const _ = require('lodash')
const app = new Koa()
const router = new KoaRouter()
const { User,Telephone } = require('./sq')

const usersFile = __dirname+'/data/users.json'

router.get('/users', async ctx=>{
    const queriedUsers = await User.findAll({include: [Telephone]})

    ctx.body = queriedUsers.map(data=>{
        let {firstName, lastName, id, telephones} = data.dataValues
        return {id, firstName, lastName, telephones}
    })
})

const cleanUser = (u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    telephones: u.telephones ? u.telephones.map(t => ({
        id: t.id,
        name: t.name,
        number: t.number                
    })) : []
})

router.post('/users', async ctx=>{
    const submittedUser = ctx.request.body
    try{
        let dbUser;
        let {firstName, lastName} = submittedUser
        if(submittedUser.telephones && submittedUser.telephones.length>0){
            let telephones = submittedUser.telephones.map(tel=>({name:tel.name, number:tel.number})) 
            dbUser = await User.create({firstName, lastName,telephones},{include: [Telephone]})
        }else{
            console.log(submittedUser)
            dbUser = await User.create({firstName, lastName})
        }
        // ctx.body = _.pick({
        //     ...dbUser.dataValues,
        //     telephones: dbUser.dataValues.telephones.map(t => _.pick(t, ['id', 'name', 'number']))
        // }, ['id', 'firstName', 'lastName', 'telephones'])

        ctx.body = cleanUser(dbUser.dataValues)

    }catch(e){
        console.error(e)
        ctx.status = 500
    }
})

router.put('/users/:id', async ctx=>{
    const id = ctx.params.id
    const user = ctx.request.body
    
    try{
        await User.update(user, { where: {id}})
        await Telephone.destroy({ where: {user_id:id}})
        await Telephone.bulkCreate(user.telephones.map(t=>({..._.omit(t,['id']),user_id:id})))
        
        ctx.body = cleanUser(await User.findOne({where:{id}, include:[Telephone]}))
    }catch(e){
        console.error(e)
        ctx.status = 500
    }


})

router.del('/users/:id', ctx=>{
    const id = ctx.params.id
    try{
        Telephone.destroy({where:{user_id:id}})
        User.destroy({where:{id}})
        ctx.status = 200
    }
    catch(e){
        console.error(e)
        ctx.status = 500
    }

})


app.use(cors())
.use(json())
.use(BodyParser())
.use(router.routes())
.use(router.allowedMethods())
.listen(3000)


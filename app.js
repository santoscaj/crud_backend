require("@babel/register");
const Koa = require('koa');
const json = require('koa-json');
const cors = require('@koa/cors')
// const cors = require('koa-cors')
const KoaRouter = require('koa-router');
const BodyParser = require('koa-bodyparser');
const fs = require('fs')
const app = new Koa()
const router = new KoaRouter()

const usersFile = __dirname+'/data/users.json'
// var userList = []


// fs.readFile(usersFile,'utf-8',(err,content)=>{
//     userList = JSON.parse(content) || []

//     if(err)
//         console.log(err)
//     else{
//         router.get('/users',ctx=>{
//             ctx.body = userList
//         })
//     }
// })

// Functions used

function userContainsRequiredFields(ctx,newUser){
    if (!newUser.id || !newUser.firstName || !newUser.lastName || !newUser.telephones  ){
        ctx.body = 'Incomplete request. You must include firstName'
        ctx.throw(400)
        return false;
    }
    return true
}

function userIdIsUnique(ctx, userId, userList){
    if( userList.find(user=>user.id === userId) ){
        ctx.response.body = 'User already exists'
        ctx.throw(409)
        return false;
    }
    return true
}

function passedTelephoneValidation(ctx, user){
    let idList = []
    let success = user.telephones.every(tel=>{
        if(!tel.id || !tel.name || !tel.number){
            ctx.response.body = 'Telephone is missing one or more required fields (id, name, number)'
            ctx.throw(400)
            return false
        }
        
        if(idList.indexOf(tel.id)>1){
            ctx.response.body = 'Duplicate telephone ID'
            ctx.throw(400)
            return false
        }

        idList.push(tel.id)
        return true
    })
    if (!success)
        return false

    return true
}

// function saveUserList(ctx, userList, bodyToBeReturned){
//     fs.writeFile(usersFile, JSON.stringify(userList) , 'utf-8', (err)=>{
//         if(err){
//             console.log(err)
//             ctx.throw(500)
//         }else{
//             ctx.body = bodyToBeReturned
            
//         }
//     })
// }

function saveUserList(ctx, userList, bodyToBeReturned){
    try{
        fs.writeFileSync(usersFile, JSON.stringify(userList),'utf-8')
        ctx.body = bodyToBeReturned
    }catch(err){
        console.err(err)
        ctx.throw(500)
    }
}


router.get('/users', ctx=>{
    const data = JSON.parse(fs.readFileSync(usersFile, {encoding:'utf8', flag:'r'}) )
    ctx.body = data
})

router.post('/users', async ctx=>{
    const newUser = ctx.request.body
    let userList = JSON.parse(fs.readFileSync(usersFile, {encoding:'utf8', flag:'r'}))

    if(!userContainsRequiredFields(ctx, newUser) || !userIdIsUnique(ctx, newUser.id, userList))
        return;

    if(!passedTelephoneValidation(ctx, newUser))
        return
    
    userList.push(newUser)
    saveUserList(ctx, userList, newUser)
})

router.put('/users/:id', async ctx=>{
    const id = ctx.params.id
    const user = ctx.request.body
    let userList = JSON.parse(fs.readFileSync(usersFile, {encoding:'utf8', flag:'r'}))

    if(!userContainsRequiredFields(ctx, user))
        return;

    if(!passedTelephoneValidation(ctx, user))
        return;
    
    let updatedUserIndex = userList.findIndex(u=>u.id===id)  
    if(updatedUserIndex>-1)
        userList.splice(updatedUserIndex, 1, user)
    else
        userList.push(user)

    saveUserList(ctx, userList, user)
})

router.del('/users/:id', ctx=>{
    const id = ctx.params.id
    let userList = JSON.parse(fs.readFileSync(usersFile, {encoding:'utf8', flag:'r'}))

    let updatedUserIndex = userList.findIndex(u=>u.id===id)  
    if(updatedUserIndex>-1){
        userList.splice(updatedUserIndex, 1)
        saveUserList(ctx, userList, {})
    }
    else
        ctx.throw(404)

})

app.use(cors())
.use(json())
.use(BodyParser())
.use(router.routes())
.use(router.allowedMethods())
.listen(3000)
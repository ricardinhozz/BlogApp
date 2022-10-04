//importing everything
    const express = require('express')
    const {engine}  = require('express-handlebars')
    const bodyParser = require('body-parser')
    const app = express()
    const admin = require('./routes/admin')
    const path = require('path')
    const mongoose = require("mongoose")
    const session = require('express-session')
    const flash= require('connect-flash')
    require('./models/Postagens')
    const Postagem = mongoose.model('postagens')
    require('./models/Categoria')
    const Categoria = mongoose.model('categorias')
    const usuarios = require('./routes/usuario')
    const passport = require('passport')
    require('./config/auth')(passport)


    const MONGO_PASSWORD = process.env.MONGO_PASSWORD;
    const MONGO_URL = MONGO_PASSWORD ? `mongodb+srv://ricardinhozz:${MONGO_PASSWORD}@cluster0.5anb5uj.mongodb.net/?retryWrites=true&w=majority` : "'mongodb://localhost/blogapp";


//Configurations
    //Session
        app.use(session({
            secret: 'node',
            resave: true,
            saveUninitialized: true
        }))
        app.use(passport.initialize())
        app.use(passport.session())
        app.use(flash())

    //Midleware
        app.use( (req,res,next) => {
            res.locals.success_msg = req.flash("success_msg")
            res.locals.error_msg = req.flash("error_msg")
            res.locals.error = req.flash('error')
            res.locals.user = req.user || null
            next()
        })

    //Body Parser
        app.use(bodyParser.urlencoded({extended: true}))
        app.use(bodyParser.json())
    //Handlebars
        app.engine('handlebars', engine({
            defaultLayout: 'main',
            runtimeOptions: {
                allowProtoPropertiesByDefault: true,
                allowProtoMethodsByDefault: true
        }}))
    app.set('view engine','handlebars')
    // Mongoose
        mongoose.Promise = global.Promise
        mongoose.connect(MONGO_URL).then( () => {
            console.log('Connection with MongoDB was sucessful.')}).catch( (err) => {
                console.log(`Connection with MongoDB met an error: ${err}`)
            })



    //Public
        app.use(express.static(path.join(__dirname,'public')))




//Rotas

    app.use('/admin',admin)
    app.use('/usuarios',usuarios)

    app.get('/', (req,res) => {
        Postagem.find().lean().populate('categoria').sort({data:'desc'}).then( (postagens) => {
            res.render('index',{postagens:postagens})
        }).catch((err) => {
            req.flash('error_msg','Houve um erro na listagem das postagens.')
            res.redirect('/404')
        })
        
    })


    app.get('/categorias/:slug',(req,res) => {
        Categoria.findOne({slug:req.params.slug}).lean().then( (categoria) => {
            if(categoria){

                Postagem.find({categoria: categoria._id}).lean().then((postagens) => {
                    res.render('categorias/postagens', {postagens:postagens, categoria: categoria})
                
                }).catch((err) => {
                    req.flash('error_msg','Houve um erro ao listar os posts')
                    res.redirect('/')
                })
                //res.render('postagem/index', {postagem:postagem})
            }else{
                req.flash('error_msg','Postagem não foi encontrada.')
                res.redirect('/')
            }
        }).catch((err) => {
            req.flash('error_msg','Houve um erro interno')
            res.redirect('/')
        })
    })


    app.get('/404',(req,res) => {
        res.send('404 error!')
    })


    app.get('/postagem/:slug', (req,res) => {
        Postagem.findOne({slug: req.params.slug}).lean().then( (postagem) => {
            if(postagem){
                res.render('postagem/index', {postagem:postagem})
            }else{
                req.flash('error_msg','Postagem não foi encontrada.')
                res.redirect('/')
            }
        }).catch((err) => {
            req.flash('error_msg','Houve um erro interno')
            res.redirect('/')
        })})



    app.get('/categorias/:slug', (req,res) => {
        Categoria.findOne({slug: req.params.slug}).lean().then( (categoria) => {
            if(categoria){
                Postagem.find({categoria:categoria._id}).lean().then((postagens) => {
                    res.render('/categorias/postagens',{postagens:postagens, categoria: categoria})

                }).catch((err) => {
                    req.flash('error_msg','Houve um erro ao listar os posts')
                    res.redirect('/')
                })

            }else{
                req.flash('error_msg','Essa categoria não existe')
                res.redirect('/')
            }
        })
    })


    app.get('/categorias', (req,res) => {
        Categoria.find().lean().then((categorias) => {
            res.render('categorias/index', {categorias:categorias})

        }).catch((err) => {
            req.flash('error_msg','Houve um erro interno')
            res.redirect('/')
        })
    })

//Outros
const PORT = process.env.PORT || 8081
app.listen(PORT, () => {})
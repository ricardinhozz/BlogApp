const express = require('express')
const router = express.Router()
const mongoose = require('mongoose') //importando a con com o mongoose
require('../models/Categoria') //importando o model Categorias.js
const Categoria = mongoose.model('categorias') //instanciando o model categorias
require('../models/Postagens')
const Postagem = mongoose.model('postagens')
const {isAdmin} = require('../helpers/isAdmin')

router.get('/', isAdmin , (req,res) => {
    res.render('admin/index')
})


router.get('/posts', isAdmin , (req,res) => {
    res.send('<h1>Main page for posts</h1>')
})


router.get('/categorias', isAdmin , (req,res) => {
    Categoria.find().lean().sort({date:'desc'}).then( (categorias) => {
        res.render('admin/categorias', {categorias:categorias})
    }).catch( (err) => {
        req.flash('error_msg','Houve um erro ao listar as categorias.')
        res.redirect('/admin')
    })
    
})

router.get('/categorias/add', isAdmin , (req,res) => {
    res.render('admin/addcategorias')
})



router.post('/categorias/nova', isAdmin , (req,res) => {

    let nome = req.body.nome
    let slug = req.body.slug
    let erros = []

    if(!nome || nome == undefined || nome == null ){
        erros.push({text:'Nome inválido'})
    }if(!slug || slug == undefined || slug == null ){
        erros.push({text:'Slug inválido'})
    }if(nome.length < 2 ){
        erros.push({text:'Nome da categoria muito curto'})
    }if(erros.length > 0 ){
        res.render("admin/addcategorias", {erros: erros})
    }else{
        
        let novaCategoria = {
            nome: nome,
            slug: slug
        }
        
        new Categoria(novaCategoria).save().then( () => {
            req.flash('success_msg','Category was saved successfully.')
            res.redirect('/admin/categorias')
        }).catch( (err) => {
            req.flash('error_msg',`Category met and error while trying to save. ${err}`)
            res.redirect('/admin')
        })
    }
       
    })




router.get('/categorias/edit/:id', isAdmin , (req,res) => {
    Categoria.findOne({_id: req.params.id}).then( (categorias) => {
        res.render('admin/editcategorias', {categorias: categorias})}).catch( (err) => {
            req.flash('error_msg',"Couldnt find Category to edit.")
            res.redirect('/admin/categorias')
        })
    
})


router.post('/categorias/edit', isAdmin , (req,res) => {

    Categoria.findOne({_id : req.body.id}).then( (categoria) => {
        categoria.nome = req.body.nome
        categoria.slug = req.body.slug

        categoria.save().then( () => {
            req.flash('success_msg','Category was edit successfully.')
            res.redirect('/admin/categorias')
        }).catch( (err) => {
            req.flash('error_msg','Couldnt edit category due internal error.')
            res.redirect('/admin/categorias')
        })
        

    }).catch( (err) => {
        req.flash('error_msg','Find method met an error while searching')
        res.redirect('/admin/categorias')
    })

})

router.post('/categorias/deletar', isAdmin , (req,res) => {
    Categoria.remove({_id : req.body.id}).then( () => {
        req.flash('success_msg', 'Category was deteled successfully.')
        res.redirect('/admin/categorias')
    }).catch( (err) => {
        req.flash('error_msg', 'Category was not deleted due an internal error.')
        res.redirect('/admin/categorias')
    })
})


router.get('/postagens', isAdmin , (req, res) => {
    
    Postagem.find().lean().populate('categoria').sort({data: 'desc'}).then((postagens) => {

        res.render('admin/postagens', {postagens: postagens})

    }).catch( (err) => {

        req.flash('error_msg', 'Erro ao listar os posts')
        res.render('/admin')

    })
    

})

router.get('/postagens/add', isAdmin ,(req,res) => {
    Categoria.find().then((categorias) => {
        res.render('admin/addpostagem', {categorias: categorias})
    }).catch((err) => {
        req.flash('error_msg','There was an internal error with the form.')
        res.redirect('/admin')
    })
    
})

router.post('/postagens/nova', isAdmin , (req,res) => {
    let erros = []
    let categoria = req.body.categoria

    if(categoria == '0'){
        erros.push({text: 'Categoria inválida'})
        req.flash('error_msg','Category is not valid.')
    }if(erros.length > 0){
        res.render('admin/addpostagem', {erros: erros})
    }else{
        const novaPostagem = {
            titulo: req.body.titulo,
            descricao: req.body.descricao,
            conteudo: req.body.conteudo,
            categoria: req.body.categoria,
            slug: req.body.slug,

        }
    
        new Postagem(novaPostagem).save().then( () => {
            req.flash('success_msg','Post was created successfully.')
            res.redirect('/admin/postagens')
        }).catch((err) => {
            req.flash('error_msg','Post was not created due internal server error.')
            res.redirect('/admin/postagens')
    })
    }
})



router.get('/postagens/edit/:id', isAdmin , (req,res) => {

    Postagem.findOne({_id: req.params.id}).then((postagem) => {

        Categoria.find().then(categorias => {
            res.render('admin/editpostagens', {categorias:categorias, postagem:postagem})
        }).catch((err) => {
            req.flash('error_msg','Houve um erro ao listar as categorias')
            res.redirect('/admin/postagens')
            })
        }).catch((err) => {
        req.flash('error_msg','Erro ao carregar o form de edição')
    }) 
})




router.post('/postagem/edit', isAdmin ,(req,res) => {

    Postagem.findOne({_id: req.body.id}).then((postagem) => {
        postagem.titulo = req.body.titulo
        postagem.slug = req.body.slug
        postagem.descricao = req.body.descricao
        postagem.conteudo = req.body.conteudo
        postagem.categoria = req.body.categoria

        postagem.save().then(() => {
            req.flash('success', 'Postagem editada com sucesso')
            res.redirect('/admin/postagens')
        }).catch((err) => {
            req.flash('error_msg', 'Erro interno')
            res.redirect('/admin/postagens')
        })

    }).catch((err) => {
        req.flash('error_msg', 'Erro ao salvar a edição')
        res.redirect('/admin/postagens')
    })
})

router.get('/postagens/deletar/:id',(req,res) => {
    Postagem.remove({_id: req.params.id}).then(() => {
        req.flash('success_msg','Post was deleted successfully')
        res.redirect('/admin/postagens')
    }).catch((err) => {
        req.flash('error_msg', 'Erro interno')
        res.redirect('/admin/postagens')
    })
})



module.exports = router
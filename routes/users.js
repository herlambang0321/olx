var express = require('express');
var router = express.Router();
var path = require('path')
const helpers = require('../helpers/util')

/* GET home page. */
module.exports = function (db) {

    router.get('/', helpers.isLoggedIn, function (req, res) {
        const url = req.url == '/' ? '/users?page=1&sortBy=id&sortMode=asc' : req.url.replace('/', '/users')

        const params = []

        if (req.query.fullname) {
            params.push(`fullname ilike '%${req.query.fullname}%'`)
        }

        if (req.query.email) {
            params.push(`email ilike '%${req.query.email}%'`)
        }

        if (req.query.phone) {
            params.push(`phone ilike '%${req.query.phone}%'`)
        }

        if (req.query.isadmin) {
            params.push(`isadmin = ${req.query.isadmin}`)
        }

        const page = req.query.page || 1
        const limit = 3
        const offset = (page - 1) * limit
        let sql = 'select count(*) as total from users';
        if (params.length > 0) {
            sql += ` where ${params.join(' and ')}`
        }
        db.query(sql, (err, data) => {
            const pages = Math.ceil(data.rows[0].total / limit)
            sql = 'select * from users'
            if (params.length > 0) {
                sql += ` where ${params.join(' and ')}`
            }
            req.query.sortMode = req.query.sortMode || 'asc';

            req.query.sortBy = req.query.sortBy || 'id';

            sql += ` order by ${req.query.sortBy} ${req.query.sortMode}`

            sql += ' limit $1 offset $2'

            db.query(sql, [limit, offset], (err, data) => {
                if (err) return res.send(err)
                res.render('admin/users/list', {
                    data: data.rows,
                    page,
                    pages,
                    query: req.query,
                    url,
                    user: req.session.user,
                    successMessage: req.flash('successMessage')
                })
            })
        })
    })

    router.get('/add', helpers.isLoggedIn, function (req, res) {
        res.render('admin/users/form', {
            user: req.session.user,
            data: {}
        })
    })

    router.post('/add', function (req, res) {
        db.query('insert into users(name) values ($1)', [req.body.name], (err) => {
            if (err) return res.send(err)
            res.redirect('/users')
        })
    })

    router.get('/delete/:id', helpers.isLoggedIn, function (req, res) {
        const id = Number(req.params.id)
        db.query('delete from users where id = $1', [id], (err) => {
            if (err) return res.send(err)
            req.flash('successMessage', `ID : ${id} Berhasil Dihapus`)
            res.redirect('/users')
        })
    })

    router.get('/edit/:id', helpers.isLoggedIn, function (req, res) {
        db.query('select * from users where id = $1', [Number(req.params.id)], (err, item) => {
            if (err) return res.send(err)
            res.render('admin/users/form', {
                user: req.session.user,
                data: item.rows[0]
            })
        })
    })

    router.post('/edit/:id', helpers.isLoggedIn, function (req, res) {
        const id = Number(req.params.id)
        db.query('update users set name = $1 where id = $2', [req.body.name, id], (err) => {
            if (err) return res.render(err)
            res.redirect('/users')
        });
    })

    return router;
}

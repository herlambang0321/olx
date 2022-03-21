var express = require('express');
var router = express.Router();
var path = require('path')
const helpers = require('../helpers/util')
const bycrpt = require('bcrypt');
const { parse } = require('path');
const saltRounds = 10;

/* GET home page. */
module.exports = function (db) {

    router.get('/', helpers.isLoggedIn, function (req, res) {
        const url = req.url == '/' ? '/ads?page=1&sortBy=id&sortMode=asc' : req.url.replace('/', '/ads')

        const params = []

        if (req.query.title) {
            params.push(`title ilike '%${req.query.title}%'`)
        }

        if (req.query.description) {
            params.push(`email ilike '%${req.query.email}%'`)
        }

        if (req.query.category) {
            params.push(`category = ${req.query.category}`)
        }

        const page = req.query.page || 1
        const limit = 3
        const offset = (page - 1) * limit
        let sql = 'select count(*) as total from ads';
        if (params.length > 0) {
            sql += ` where ${params.join(' and ')}`
        }
        db.query(sql, (err, data) => {
            const pages = Math.ceil(data.rows[0].total / limit)
            sql = 'select * from ads'
            if (params.length > 0) {
                sql += ` where ${params.join(' and ')}`
            }
            req.query.sortMode = req.query.sortMode || 'asc';

            req.query.sortBy = req.query.sortBy || 'id';

            sql += ` order by ${req.query.sortBy} ${req.query.sortMode}`

            sql += ' limit $1 offset $2'

            db.query(sql, [limit, offset], (err, data) => {
                if (err) return res.send(err)
                db.query('select * from categories order by id', (err, categories) => {
                    if (err) return res.send(err)
                    db.query('select * from users order by id', (err, users) => {
                        if (err) return res.send(err)
                        res.render('admin/ads/list', {
                            data: data.rows,
                            page,
                            pages,
                            query: req.query,
                            url,
                            user: req.session.user,
                            categories: categories.rows,
                            users: users.rows,
                            successMessage: req.flash('successMessage')
                        })
                    })
                })
            })
        })
    })

    router.get('/add', helpers.isLoggedIn, function (req, res) {
        res.render('admin/ads/form', {
            user: req.session.user,
            data: {}
        })
    })

    router.post('/add', function (req, res) {
        bycrpt.hash(req.body.pass, saltRounds, function (err, hash) {
            if (err) {
                console.log(err)
                req.flash('successMessage', `gagal bikin password`)
                return res.redirect('/ads')
            }
            if (!req.files || Object.keys(req.files).length === 0) {
                db.query('insert into ads(fullname, email, phone, pass, isadmin) values ($1, $2, $3, $4, $5)', [req.body.fullname, req.body.email, req.body.phone, hash, JSON.parse(req.body.isadmin)], (err) => {
                    if (err) {
                        console.log(err)
                        req.flash('successMessage', `gagal bikin user`)
                        return res.redirect('/ads')
                    }
                    res.redirect('/ads')
                })
            } else {
                const file = req.files.avatar;
                const fileName = `${Date.now()}-${file.name}`
                uploadPath = path.join(__dirname, '..', 'public', 'images', 'avatars', fileName);

                // Use the mv() method to place the file somewhere on your server
                file.mv(uploadPath, function (err) {
                    if (err)
                        return res.status(500).send(err);
                    db.query('insert into ads(fullname, email, phone, pass, isadmin, avatar) values ($1, $2, $3, $4, $5, $6)', [req.body.fullname, req.body.email, req.body.phone, hash, JSON.parse(req.body.isadmin), fileName], (err) => {
                        if (err) {
                            console.log(err)
                            req.flash('successMessage', `gagal bikin user plus avatar`)
                            return res.redirect('/ads')
                        }
                        res.redirect('/ads')
                    });
                });
            }
        })
    })

    router.get('/delete/:id', helpers.isLoggedIn, function (req, res) {
        const id = Number(req.params.id)
        db.query('delete from ads where id = $1', [id], (err) => {
            if (err) return res.send(err)
            req.flash('successMessage', `ID : ${id} Berhasil Dihapus`)
            res.redirect('/ads')
        })
    })

    router.get('/edit/:id', helpers.isLoggedIn, function (req, res) {
        db.query('select * from ads where id = $1', [Number(req.params.id)], (err, item) => {
            if (err) return res.send(err)
            res.render('admin/ads/form', {
                user: req.session.user,
                data: item.rows[0]
            })
        })
    })

    router.post('/edit/:id', helpers.isLoggedIn, function (req, res) {
        const id = Number(req.params.id)
        if (!req.files || Object.keys(req.files).length === 0) {
            db.query('update ads set fullname = $1, email = $2, phone = $3, isadmin = $4 where id = $5', [req.body.fullname, req.body.email, req.body.phone, JSON.parse(req.body.isadmin), id], (err) => {
                if (err) {
                    console.log(err)
                    req.flash('successMessage', `gagal bikin user`)
                    return res.redirect('/ads')
                }
                res.redirect('/ads')
            })
        } else {
            const file = req.files.avatar;
            const fileName = `${Date.now()}-${file.name}`
            uploadPath = path.join(__dirname, '..', 'public', 'images', 'avatars', fileName);

            // Use the mv() method to place the file somewhere on your server
            file.mv(uploadPath, function (err) {
                if (err)
                    return res.status(500).send(err);
                db.query('update ads set fullname = $1, email = $2, phone = $3, isadmin = $4, avatar = $5  where id = $6', [req.body.fullname, req.body.email, req.body.phone, JSON.parse(req.body.isadmin), fileName, id], (err) => {
                    if (err) {
                        console.log(err)
                        req.flash('successMessage', `gagal bikin user plus avatar`)
                        return res.redirect('/ads')
                    }
                    res.redirect('/ads')
                });
            });
        }
    })

    return router;
}

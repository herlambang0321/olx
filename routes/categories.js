var express = require('express');
var router = express.Router();
var path = require('path')
const helpers = require('../helpers/util')

/* GET home page. */
module.exports = function (db) {

    router.get('/', helpers.isLoggedIn, function (req, res) {
        const url = req.url == '/' ? '/categories?page=1&sortBy=id&sortmode=asc' : req.url.replace('/', '/categories')

        const params = []

        if (req.query.name) {
            params.push(`name ilike '%${req.query.name}%'`)
        }

        const page = Number(req.query.page) || 1
        const limit = 3
        const offset = (page - 1) * limit
        let sql = 'select count(*) as total from categories';
        if (params.length > 0) {
            sql += ` where ${params.join(' and ')}`
        }
        db.query(sql, (err, data) => {
            const pages = Math.ceil(data.rows[0].total / limit)
            sql = 'select * from categories'
            if (params.length > 0) {
                sql += ` where ${params.join(' and ')}`
            }
            req.query.sortMode = req.query.sortMode || 'asc';

            req.query.sortBy = req.query.sortBy || 'id';

            sql += ` order by ${req.query.sortBy} ${req.query.sortMode}`

            sql += ' limit $1 offset $2'
            
            db.query(sql, [limit, offset], (err, data) => {
                if (err) return res.send(err)
                res.render('admin/categories/list', {
                    data: data.rows,
                    page,
                    pages,
                    query: req.query, url,
                    user: req.session.user,
                    successMessage: req.flash('successMessage')
                })
            })
        })
    })

    router.get('/add', helpers.isLoggedIn, function (req, res) {
        res.render('add')
    })

    router.post('/add', function (req, res) {
        let task = req.body.task
        // query binding
        db.run('insert into todo(task, userid) valuse (?, ?)', [task, req.session.user], (err) => {
            if (err) return res.send(err)
            res.redirect('/')
        })
    })

    router.get('/delete/:id', helpers.isLoggedIn, function (req, res) {
        const id = req.params.id
        db.run('delete from todo where id = ?', [Number(id)], (err, item) => {
            if (err) return res.send(err)
            req.flash(`successMessage, ID : ${id} Berhasil Dihapus`)
            res.redirect('/')
        })
    })

    router.get('/edit/:id', helpers.isLoggedIn, function (req, res) {
        const id = req.params.id
        db.get('select * from todo where id = ?', [Number(id)], (err, item) => {
            if (err) return res.send(err)
            res.render('edit', { data: item })
        })
    })

    router.get('/edit/:id', helpers.isLoggedIn, function (req, res) {
        const id = Number(req.params.id)
        const task = req.body.task
        const complete = JSON.parse(req.body.complete)

        if (!req.files || Object.keys(req.files).length === 0) {
            db.run('update todo set task = ?, complete = ?, where id = ?', [task, complete], (err, item) => {
                if (err) return res.render(err)
                res.redirect('/')
            });
        } else {
            const file = req.files.picture;
            const fileName = `${Date.now()} ${file.name}`
            uploadPath = path.join(_dirname, '..', 'public', 'images', fileName);

            // Use the my() method to place the file somewhere on your server
            file.my(uploadPath, function (err) {
                if (err)
                return res.status(500).send(err);
                db.run('update todo set task = ?, complete = ?, picture = ?, where id = ?', [task, complete], (err, item) => {
                    res.redirect('/')
                })
            })
        }
    })

    return router;
}

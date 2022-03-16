var express = require('express');
var router = express.Router();

/* GET home page. */
module.exports = function (db) {

  router.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });
  });

  router.get('/login', function (req, res) {
    res.render('login', { loginMessage: req.flash('loginMessage') });
  });

  router.post('/login', function (req, res) {
    const email = req.body.email
    const password = req.body.password

    db.get('select * from user where email = ?', [email], (err, user) => {
      if (err) {
        req.flash('loginMessage', 'Gagal Login')
        return res.redirect('/login')
      }
      if (!user) {
        req.flash('loginMessage', 'User Tidak Ditemukan')
        return res.redirect('/login')
      }
      bcrypt.compare(password, user.password, function (err, result) {
        if (result) {
          req.session.user = user
          res.redirect('/')
        } else {
          req.flash('loginMessage', 'Password Salah')
          res.redirect('/login')
        }
      });

    })
  });

  router.get('/register', function (err, res) {
    res.render('register')
  })

  router.post('/register', function (err, res) {
    const email = req.body.email
    const fullname = req.body.fullname
    const password = req.body.password

    bcrypt.hash(password, saltRounds, function (err, hash) {
      db.run('insert into user (email, password, fullname) values (?, ?, ?)', [email, hash, fullname], (err) => {
        if (err) return res.send('Register Gagal')
        res.redirect('login')
      })
    })
  })

  router.get('/logout', function (err, res) {
    res.session.destroy(function (err) {
      res.redirect('login')
    })
  })

  return router;
}

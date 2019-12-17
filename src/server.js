const express = require('express')
const setupAuth = require('./auth.js')
const getOrCreateIDE = require('./crd.js')
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn

const BASE_DOMAIN = process.env.BASE_DOMAIN

const app = express();
app.set('view engine', 'ejs');

app.use(require('morgan')('combined'));
app.use(require('body-parser').urlencoded({ extended: true }));

setupAuth(app, BASE_DOMAIN)

app.get('/', ensureLoggedIn(), (req, res) => {
  //TODO improve
  const username = req.user.email.split('@')[0].replace('.','')

  getOrCreateIDE(username, BASE_DOMAIN).then(({url, readyMsg})=>{
    if(readyMsg) 
      res.render('wait',{readyMsg})
    else
      res.redirect(url)
  }).catch((err)=>{
    console.error('got error:',err)
    res.send(err)
  })
})

app.listen(8080)

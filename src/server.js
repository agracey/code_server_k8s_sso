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

//TODO: There is a leak of data here. If the user exists and has logged in, the redirect includes extra steps. 
//      This is likely fixed with a smarter default backend that will act like a failure of auth to hide the real failures vs fake.

// This will check that only the correct user can access their IDE. 
// It'd be nice to allow "guest passes" but I don't know how to do that at the moment...
// Might be possible if I get the object and store guests in it?
app.get('/auth', ensureLoggedIn(), (req, res) => {
  const username = req.user.email.split('@')[0].replace('.','')
  const ide_owner = req.headers['x-forwarded-host'].split('.')[0]

  if (username == ide_owner) res.sendStatus(204)
  else res.redirect(`http://ui.${BASE_DOMAIN}`)
})

app.listen(8080)
const passport = require('passport');
//const { Strategy, Issuer } = require('openid-client');
const OidcStrategy = require('passport-openidconnect').Strategy;

const OIDC_INGRESS = process.env.OIDC_INGRESS
const OIDC_LINK_BASE = process.env.OIDC_LINK_BASE || OIDC_INGRESS
const OIDC_CALLBACK = process.env.OIDC_CALLBACK
const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID
const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET
const BASE_DOMAIN = process.env.BASE_DOMAIN

// set up passport
passport.use('oidc', new OidcStrategy({
  scope: 'openid profile groups email',
  clientID: OIDC_CLIENT_ID,
  clientSecret: OIDC_CLIENT_SECRET,
  authorizationURL:`${OIDC_INGRESS}/auth`,
  tokenURL: `${OIDC_INGRESS}/token`,
  callbackURL: `${OIDC_CALLBACK}/callback`, //TODO should be called INGRESS_DOMAIN
  userInfoURL: `${OIDC_LINK_BASE}/userinfo`,
  issuer: OIDC_INGRESS,
  skipUserProfile: true
}, (issuer, sub, profile, jwtClaims, accessToken, refreshToken, params, done) => {
  return done(null, jwtClaims);
}));


passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

module.exports = function setupAuth(app, baseDomain){
  app.use(require('cookie-parser')());
  app.use(require('express-session')({ 
    secret: 'somethingrandom', 
    resave: true, 
    saveUninitialized: true, 
    cookie:{
      maxAge: 1209600000,
      secure: false,
      domain: `.${baseDomain}`
    } 
  }));
  
  app.use(passport.initialize());
  app.use(passport.session());
  app.get('/login',
    passport.authenticate('oidc'));
  
  app.get('/callback', 
    passport.authenticate('oidc', { failureRedirect: OIDC_CALLBACK + '/login' }),
    function(req, res) {
      res.redirect('/');
  });

  //TODO: There is a leak of data here. If the user exists and has logged in, the redirect includes extra steps. 
  //      This is likely fixed with a smarter default backend that will act like a failure of auth to hide the real failures vs fake.

  // This will check that only the correct user can access their IDE. 
  // It'd be nice to allow "guest passes" but I don't know how to do that at the moment...
  // Might be possible if I get the object and store guests in it? But that seems heavy handed
  app.get('/auth', (req, res) => {

    if(!req.user) {
      res.redirect(`http://ui.${BASE_DOMAIN}`)
      return
    }

    const username = req.user.email.split('@')[0].replace('.','')
    const ide_owner = req.headers['x-forwarded-host'].split('.')[0]

    if (username == ide_owner) res.sendStatus(204)
    else res.redirect(`http://ui.${BASE_DOMAIN}`)
  })
}
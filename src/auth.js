const passport = require('passport');
//const { Strategy, Issuer } = require('openid-client');
const OidcStrategy = require('passport-openidconnect').Strategy;

const OIDC_INGRESS = process.env.OIDC_INGRESS
const OIDC_LINK_BASE = process.env.OIDC_LINK_BASE || OIDC_INGRESS
const OIDC_CALLBACK = process.env.OIDC_CALLBACK
const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID
const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET

// set up passport
passport.use('oidc', new OidcStrategy({
  scope: 'openid profile groups email',
  clientID: OIDC_CLIENT_ID,
  clientSecret: OIDC_CLIENT_SECRET,
  authorizationURL:`${OIDC_INGRESS}/auth`,
  tokenURL: `${OIDC_INGRESS}/token`,
  callbackURL: `${OIDC_CALLBACK}/callback`,
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
    passport.authenticate('oidc', { failureRedirect: '/login' }),
    function(req, res) {
      res.redirect('/');
  });
}
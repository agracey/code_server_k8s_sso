# code_server_k8s_sso
A operator and SSO integration for cdr/code_server


This project is to allow deploying personal Visual Studio Code IDEs into a Kubernetes. This is leveraging https://github.com/cdr/code-server. 

As of the moment, I've made the happypath work but haven't fully tested the chart to install it all.

## Dependencies:

- The [Traefik Ingress Controller](https://github.com/helm/charts/tree/master/stable/traefik) is used for it's Forward Auth capabilities. 
- An OpenID Connect provider (Dex makes it easy)
- Kubernetes (not sure on what minimum version. Let's say 1.15+)
- DNS wildcard to resolve a subdomain. Used to help with SSO and forward Auth


## Installation:

- Add the helm repo: `helm repo add code_servers https://agracey.github.io/code_server_k8s_sso/`
- Create a values file with at least the following fields: 
```
env:
  OIDC_INGRESS: "https://master1.tm.suse.com:32000" # The external address of the Oauth Provider
  OIDC_CALLBACK: "http://coder.<domain>" # Set up with the Oauth Provider and DNS wildcard
  OIDC_CLIENT_ID: "CODE" # Set up with the Oauth Provider
  OIDC_CLIENT_SECRET: "12345" # Set up with the Oauth Provider
  BASE_DOMAIN: "ide.lab.susedemos.com" # The domain with the wildcard
```
- Install with: `helm install code_servers/code_server_k8s -f values.yaml --name codeservers --namespace ide`
- Browse to http://portal.<domain> to get redirected to a login.

NOTE: at the moment, there's no page to wait while the IDE is being created. It'll take 30s to a minute and a reload will work. This is on the list to fix first.

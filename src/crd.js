const k8s = require('@kubernetes/client-node');

const IDE_NAMESPACE = process.env.IDE_NAMESPACE || 'ide'
const CRD_GROUP = process.env.CRD_GROUP || 'coder.com'
const CRD_VERSION = process.env.CRD_VERSION || 'v1alpha1'
const CRD_KIND = process.env.CRD_KIND || 'CodeServer'
const CRD_PLURAL = process.env.PLURAL || CRD_KIND.toLowerCase()+'s'

const kc = new k8s.KubeConfig();
kc.loadFromCluster();

const k8sApi = kc.makeApiClient(k8s.CustomObjectsApi);


async function buildIDEObject(name, domain){
  return k8sApi.createNamespacedCustomObject(CRD_GROUP, CRD_VERSION, IDE_NAMESPACE, CRD_PLURAL, {
    apiVersion: `${CRD_GROUP}/${CRD_VERSION}`,
    kind: CRD_KIND,
    metadata:{
      name
    },
    spec: {
      ingress:{
        domain
      }
    }
  })
}

module.exports = async function getOrCreateIDE(username, domain) {

  let readyMsg = null
  const {body} = await k8sApi.listNamespacedCustomObject(CRD_GROUP, CRD_VERSION, IDE_NAMESPACE, CRD_PLURAL)
 
  const codeServerList = (body.items||[]).filter((item)=>(
    item.metadata.name==username
  ))

  if (codeServerList.length == 1 ) {
    // Check if ready and display waiting prompt?
    const unreadyReasons = (codeServerList[0].status.conditions||[])
    .filter((condition)=>(condition.status != "True"))
    if (unreadyReasons.length > 0)
    readyMsg = unreadyReasons.reduce((acc,curr)=>(acc + "," + (curr.reason || curr.type)), "")
  } else {
    // Create one if not already created
    await buildIDEObject(username,domain)
    readyMsg = "Setting up Personal Storage and Pulling Image"
  }
  return {url:`http://${username}.${domain}/`,readyMsg}
}

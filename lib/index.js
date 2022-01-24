const { MeiliSearch } = require('meilisearch');
const client = new MeiliSearch({
  host: 'http://127.0.0.1:7700',
  apiKey: '8dcbb482663333d0280fa9fedf0e0c16d52185cb67db494ce4cd34da32ce2092'
});
const audit = client.index('auditlogs');

const removePasswords = (key, value) => (key === 'password' ? undefined : value);
const getContentType = (path) => {
  if (path.includes('service-request')) { return 'Service Request'; }
  if (path.includes('register')) { return 'Account Registration'; }
  if (path.includes('local')) { return 'Account Login'; }
  if (path.includes('service')) { return 'Service'; }
  if (path.includes('content-types') || path.includes('content-manager')) { return 'Admin'; }

  return 'Others';
};

const getActionType = (method, path) => {
  if (method.toLowerCase() === 'post' && path.includes('service-request')) { return 'Created Service Request'; }
  if (method.toLowerCase() === 'get' && path.includes('content-manager')) { return 'Admin content View'; }
  if (method.toLowerCase() === 'post' && path.includes('content-manager')) { return 'Admin content create'; }
  if (method.toLowerCase() === 'put' && path.includes('content-manager')) { return 'Admin content update'; }
  if (method.toLowerCase() === 'post' && path.includes('register')) { return 'User Register'; }
  if (method.toLowerCase() === 'post' && path.includes('local')) { return 'User log in'; }

  return 'Other Activities';
};

module.exports = (strapi) => {
  return {
    initialize() {
      strapi.app.use(async (ctx, next) => {
        await next();
        if (ctx.state && ctx.state.user) {
          const entry = {
            contentType: getContentType(ctx._matchedRoute),
            action: getActionType(ctx.request.method, ctx._matchedRoute),
            statusCode: ctx.response.status,
            user: { id: ctx.state.user.id, email: ctx.state.user.email, ip: ctx.request.ip, },
            method: ctx.request.method,
            route: ctx._matchedRoute,
            params: ctx.params,
            request: ctx.request.body,
            content: ctx.response.body,
          };
          strapi.log.child('audit').info(JSON.stringify(entry, removePasswords));
          if ((ctx.params.model && ctx.params.model.includes('trail')) || (ctx.params.uid && ctx.params.uid.includes('trail'))) {
            //Do nothing
          } else {
            // await strapi.services.trails.create(JSON.stringify(entry, removePasswords));
            strapi.log.child('audit').info(JSON.stringify(entry, removePasswords))
            let response = await audit.addDocuments(entry)
            console.log(response)
            // => { "uid": 0 }
          }
        }
      });
    },
  };
};
// module.exports = (strapi) => {
//   return {
//     initialize() {
//       strapi.app.use(async (ctx, next) => {
//         await next()
//         if (ctx.state && ctx.state.user) {
//           const entry = {
//             contentType: getContentType(ctx._matchedRoute),

//             action: getActionType(ctx.request.method, ctx._matchedRoute),
//             statusCode: ctx.response.status,
//             user: { id: ctx.state.user.id, email: ctx.state.user.email, ip: ctx.request.ip },
//             method: ctx.request.method,
//             route: ctx._matchedRoute,
//             params: ctx.params,
//             query: ctx.request.query,
//             body: ctx.request.body,
//           }
//           if ((ctx.params.model && ctx.params.model.includes('audit-logs')) || (ctx.params.uid && ctx.params.uid.includes('audit-logs'))) {
//             // Do Nothing !! 
//           } else {
//             await strapi.services['audit-logs'].create(JSON.stringify(entry, removePasswords));
//           }
//           strapi.log.child('audit').info(JSON.stringify(entry, removePasswords))
//           return entities.map(entity => sanitizeEntity(entity, { model: strapi.models.categories }));
//         }
//       })
//     },
//   }
// }
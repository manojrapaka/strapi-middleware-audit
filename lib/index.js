const { MeiliSearch } = require(meilisearch);
const client = new MeiliSearch({
  host: '',
  apiKey: ''
});
const audit = client.index('auditlogs');

const removePasswords = (key, value) => (key === 'password' ? undefined : value)

module.exports = (strapi) => {
  return {
    initialize() {
      strapi.app.use(async (ctx, next) => {
        await next()

        if (ctx.state.user) {
          const entry = {
            user: {
              id: ctx.state.user.id,
              email: ctx.state.user.email,
              ip: ctx.request.ip,
            },
            method: ctx.request.method,
            route: ctx._matchedRoute,
            params: ctx.params,
            query: ctx.request.query,
            body: ctx.request.body,
          }

          strapi.log.child('audit').info(JSON.stringify(entry, removePasswords))
        }
      })
    },
  }
}

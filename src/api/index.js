const Router = require('koa-router');

const api = new Router();

api.get('/test', (ctx) => {
    ctx.body = 'sucess test';
});

module.exports = api;
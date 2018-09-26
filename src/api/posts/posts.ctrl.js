const Post = require('models/post');
const {ObjectId} = require('mongoose').Types;
const Joi = require('joi');

exports.checkObjectId = (ctx, next) => {
    const {id} = ctx.params;

    if(!ObjectId.isValid(id)){
        ctx.status = 400;
        return null;
    }

    return next();
}

exports.write = async (ctx) => {
    // 객체가 지닌 값들을 검증합니다.
  const schema = Joi.object().keys({
    title: Joi.string().required(), // 뒤에 required를 붙여주면 필수 항목이라는 의미
    body: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).required() // 문자열 배열
  });

  // 첫 번째 파라미터는 검증할 객체, 두 번째는 스키마
  const result = Joi.validate(ctx.request.body, schema);

  // 오류 발생 시 오류 내용 응답
  if (result.error) {
    ctx.status = 400;
    ctx.body = result.error;
    return;
  }

    const { title, body, tags } = ctx.request.body;

    const post = new Post({
        title, body, tags
    });

    try{
        await post.save();
        ctx.body = post;
    } catch(e) {
        ctx.throw(e, 500);
    }
}

exports.list = async (ctx) => {
    const page = parseInt(ctx.query.page || 1, 10 )
    
    if(page < 1){
        ctx.status = 400;
        return;
    }

    try{
        const posts = await Post.find()
            .sort({"_id":-1})
            .limit(10)
            .skip((page - 1) * 10)
            .lean()
            .exec();
        
        const postCount = await Post.count().exec();   
        
        const limitBodyLength = post => ({
            ...post,
            body: post.body.length < 200 ? post.body : `${post.body.slice(0, 200)}...`
        });
        ctx.body = posts.map(limitBodyLength);
        // 마지막 페이지 알려주기
        // ctx.set은 response header를 설정해줍니다.
        ctx.set('Last-Page', Math.ceil(postCount / 10));
    } catch (e) {
        ctx.throw(e, 500);
    }
}

exports.read = async (ctx) => {
    const {id} = ctx.params;
    try{
        const post = await Post.findById(id).exec();
        if(!post){
            ctx.status = 404;
            return;
        }
        ctx.body = post;
    } catch (e) {
        ctx.throw(e, 500);
    }
}

exports.remove = async (ctx) => {
    const {id} = ctx.params;
    try{
        await Post.findByIdAndRemove(id).exec();
        ctx.status = 204;
    } catch (e) {
        ctx.throw(e, 500);
    }
}



exports.update = async (ctx) => {
    const {id} = ctx.params;
    try{
        const post = await Post.findByIdAndUpdate(id, ctx.request.body, {
            new: true
            //이 값을 설정해야 업데이트된 객체를 반환합니다 . 
            // 설정하지 않으면 업데이트되기 전의 객체를 반환합니다
        }).exec();
        if(!post){
            ctx.status = 404;
            return;
        }
        ctx.body = post;
    } catch (e) {
        ctx.throw(e, 500);
    }
}
module.exports = async (ctx, next) => {
    const user = ctx.state.user;

    if((!user || !user.isOrganization) && user.role.name!="Admin"){
        return ctx.unauthorized('Only organizations are allowed to use this route.');
    }

    return await next();
}
module.exports = ({ env }) => ({
  host: env("HOST", "0.0.0.0"),
  port: env.int("PORT", process.env.PORT || 1337),
//   url: "https://nescii-admin.herokuapp.com/",
  admin: {
    auth: {
      secret: env("ADMIN_JWT_SECRET", "590872c60fbf83420c349190045aceec"),
    },
  },
});

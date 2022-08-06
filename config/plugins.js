module.exports = () => ({
  upload: {
    provider: "aws-s3",
    providerOptions: {
      accessKeyId: "AKIAUEQVH3EZGM4VW3CG",
      secretAccessKey: "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",
      region: "ap-south-1",
      params: {
        Bucket: "nescii",
      },
    },
  },
  email:{
    provider: 'nodemailer',
    providerOptions: {
      service: 'gmail',
      auth:{
          user: 'editor.nescii@gmail.com',
          pass: 'nesciiadmin123'
      },
      pool: true
    },
    settings: {
      defaultFrom: 'editor.nescii@gmail.com',
      defaultReplyTo: 'editor.nescii@gmail.com',
    },
  }
});


// module.exports = () => ({
//   upload: {
//     provider: "aws-s3",
//     providerOptions: {
//       accessKeyId: "AKIAIZ3FIY44LSPKJOSQ",
//       secretAccessKey: "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",
//       region: "ap-south-1",
//       params: {
//         Bucket: "nescii",
//       },
//     },
//   },
// });

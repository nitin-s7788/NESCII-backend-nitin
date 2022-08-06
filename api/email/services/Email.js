const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user: 'editor.nescii@gmail.com',
        pass: 'nesciiadmin123'
    },
    pool: true,
});


module.exports = {
    sendCustomMail: (toEmail, subject, templateName, htmlObject) => {
        const fs = require('fs');
        const path = require('path');

        let importedTemplate = fs.readFileSync(path.resolve(__dirname, `${templateName}.hbs`)).toString('utf-8');
        const HandleBars = require('handlebars');
        let template1 = HandleBars.compile(importedTemplate);
        let result = template1(htmlObject);

        const mailOptions = {
            from: 'Nescii Admin<editor.nescii@gmail.com>',
            to: toEmail,
            subject: subject,
            text: subject,
            // html: output
            // template: result
            html : result
        };

        return transporter.sendMail(mailOptions, (err, info)=>{
            console.log(err);
        });
    },

    sendMailToAll: async (subject, templateName, htmlObject) => {
        const allUsers = await strapi.query('user', 'users-permissions').find({});
        allUsersEmail = allUsers.map((item)=>({name: item.name, address: item.email}));

        const fs = require('fs');
        const path = require('path');

        let importedTemplate = fs.readFileSync(path.resolve(__dirname, `${templateName}.hbs`)).toString('utf-8');
        const HandleBars = require('handlebars');
        let template1 = HandleBars.compile(importedTemplate);
        let result = template1(htmlObject);

        const mailOptions = {
            from: 'Nescii Admin<editor.nescii@gmail.com>',
            to: allUsersEmail,
            subject: subject,
            text: subject,
            // html: output
            // template: result
            html : result
        };

        return transporter.sendMail(mailOptions, (err, info)=>{
            if(err)
                console.log(err);
            else 
                console.log(`[${new Date()}]: mails sent`);
        });
    },

    sendMailToAllUsers: async (subject, templateName, htmlObject) => {
        let allUsers = await strapi.query('user', 'users-permissions').model.find({isOrganization: false});
        allUsersEmail = allUsers.map((item)=>({name: item.name, address: item.email}));

        const fs = require('fs');
        const path = require('path');

        let importedTemplate = fs.readFileSync(path.resolve(__dirname, `${templateName}.hbs`)).toString('utf-8');
        const HandleBars = require('handlebars');
        let template1 = HandleBars.compile(importedTemplate);
        let result = template1(htmlObject);

        const mailOptions = {
            from: 'Nescii Admin<editor.nescii@gmail.com>',
            to: allUsersEmail,
            subject: subject,
            text: subject,
            // html: output
            // template: result
            html : result
        };

        return transporter.sendMail(mailOptions, (err, info)=>{
            if(err)
                console.log(err);
            else 
                console.log(`[${new Date()}]: mails sent`);
        });
    }
}
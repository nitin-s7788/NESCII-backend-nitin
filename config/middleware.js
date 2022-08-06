module.exports = {
    settings: {
        gzip:{
            enabled: true
        },
        parser: {
            enabled: true, 
            multipart: true,
            formLimit: '2mb',
            jsonLimit: '2mb',
            textLimit: '2mb',
            formidable:{
                maxFileSize: 3 * 1024 * 1024,
                maxFieldsSize: 2 * 1024 * 1024
            }   
        }
    },
}
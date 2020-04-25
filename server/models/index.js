const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);

const mongoose = require("mongoose");
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('autoIndex', false);
const connectionUrl = 'mongodb://root:bk123456@mongo:27017/find_number?authSource=admin';

const connect = mongoose.connect(connectionUrl, {useNewUrlParser: true})
    .then(() => {
        console.log('INFO: Database connected');
    })
    .catch(error => {
        console.error('ERROR: Can not connect to database', error);

    });
let db = {};

fs
    .readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        const model = require(path.join(__dirname, file));
        console.log('INFO | Model imported: ', model.modelName);
        model.on('index', function (err) {
            if (err) console.error(`FAILED | create index on ${model.modelName}`, err);
        });
        db[model.modelName] = model;
    });
db.connect = connect;
db.mongoose = mongoose;

module.exports = db;

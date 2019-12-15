const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');

require('./config/config');

var mongoose = require('./db/mongoose');
var { User } = require('./model/user');

app = express();

app.use(bodyParser.json());
app.use(bodyParser.raw());

app.get('/', (request, response) => {
    response.send("root response");
});

app.post('/users/signup',  async (req, res) => {
    var login = _.pick(req.body, ['email', 'password']);
    
    var user = new User({
        email: login.email,
        password: login.password
    });

    try {
        let result = await  user.save();
        res.status(200).send(_.pick(req.body, ['email']));
    } catch(e){
        console.log(e);
        res.status(500).send();
    }
});

app.listen('80', () => {
    console.log("Server started on 80");
});

module.exports = {
	app
};
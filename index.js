const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

require('./config/config');

var mongoose = require('./db/mongoose');
var { User } = require('./model/user');

app = express();

app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(cookieParser());

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
        let token = await user.generateAuthToken();
        res.cookie('auth', token, {maxAge:900000, httpOnly: true});
        res.set('auth', token);
        let activationToken = jwt.sign({_id: user._id.toHexString()},  process.env.JWT_SECRET).toString();
        res.set('activation', activationToken);
        res.status(200).send(_.pick(req.body, ['email']));
    } catch(e){
        console.log(e);
        res.status(500).send();
    }
});

app.post('/users/activate/:token', async (req, res) => {
    let token = req.params.token;
    
	try{
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        User.findOne({_id: decoded._id}, function(err, user){
            if(err != null){
                console.log(err);
                res.status(500).send();
            } else {
                user.isActivated = true;
                let result = user.save();
                res.status(200).send(_.pick(req.body, ['email']));        
            }
        });
	}
	catch(e){
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
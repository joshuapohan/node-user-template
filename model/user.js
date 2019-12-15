const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

var UserSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		trim: true,
		minlength: 1,
		unique: true,
		validate: {
			validator: validator.isEmail,
			message: '{VALUE} is not a valid email'
		}
	},
	password: {
		type: String,
		required: true,
		minlength: 6
	},
	tokens: [{
		access: {
			type:String,
			required: true
		},
		token: {
			type:String,
			required: true
		}
	}]
});

UserSchema.pre('save', function(next){
	var user = this;

	if(user.isModified('password')){
		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(user.password, salt, (err, hash) => {
				user.password = hash;
				next();
			});
		});
	} else{
		next();
	}
});

UserSchema.methods.toJSON = function(){
	var user = this;
	var userObj  = user.toObject();

	return _.pick(userObj,['_id', 'email']);
};

UserSchema.statics.findByToken = function(token){
	var User = this;
	var decoded;

	try{
		decoded = jwt.verify(token, process.env.JWT_SECRET);
	}
	catch(e){
		return Promise.reject();
	}
	return User.findOne({
		_id: decoded._id,
		'tokens.token': token,
		'tokens.access': 'auth'
	})

};

UserSchema.statics.findByCredential = function(credential){
	return User.findOne({email: credential.email}).then((user) =>{
		if(user){
			return new Promise((resolve, reject) => {
				bcrypt.compare(credential.password, user.password, (err, result) => {
					if(result){
						resolve(user);
					}
					else{
						reject();
					}
				});
			});
		} else {
			return Promise.reject();
		}
	});
}

UserSchema.methods.generateAuthToken = function(){
	var user = this;
	var access = 'auth';
	var token = jwt.sign({_id: user._id.toHexString(), access},  process.env.JWT_SECRET).toString();
	var tokenObj = {
		access,
		token
    }
    
	user.tokens = user.tokens.concat([tokenObj]);
	return user.save().then(() => {
		return token;
	}).catch((e) => {
		console.log(e);
	});
};

UserSchema.methods.removeToken = function(token){
	var user = this;

	return user.update({
		$pull: {
			tokens: {
				token: token
			}
		}
	}).catch((e) => {
		return Promise.reject();
	});
};

var User = mongoose.model('User', UserSchema);

module.exports = {
	User
};
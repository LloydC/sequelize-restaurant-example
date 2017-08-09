const Sequelize = require('sequelize')
const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')

// CONFIG dependencies
const app = express()

app.set('views','./views')
app.set('view engine','pug')

app.use(bodyParser.urlencoded({extended: true}))
app.use(session({
  secret: "safe",
  saveUnitialized: false,
  resave: true
}))

const sequelize = new Sequelize('sequelize_restaurant_example',process.env.POSTGRES_USER,null,{
  host: 'localhost',
  dialect: 'postgres'
})

//MODELS DEFINITION
const Waiter = sequelize.define('waiters',{
  name: {
    type: Sequelize.STRING
  },
  email: {
    type: Sequelize.STRING,
    unique: true
  },
  password:{
    type: Sequelize.STRING
  }
},{
  timestamps: false
})

const Table = sequelize.define('tables',{
  name:{
    type: Sequelize.STRING
  }
},{
  timestamps: false
})

const Order = sequelize.define('orders',{
  menuOrder:{
    type: Sequelize.STRING
  },
  drinkOrder:{
    type: Sequelize.STRING
  }
})

// TABLES RELATIONSHIP/ASSOCIATION

Waiter.hasMany(Table)
Waiter.hasMany(Order)
Table.hasMany(Order)
Table.belongsTo(Waiter)
Order.belongsTo(Waiter)
Order.belongsTo(Table)

//----------------ROUTES----------------

//ROUTE 01: HOME------------------------
app.get('/', function(req, res){

	var user = req.session.user

	res.render("home", {user: user})

});

//CHECKING IF FORM INPUT USERDATA MATCHES DATABASE ENTRY. IF YES, ASSIGN SESSION TO USER.
app.post('/', function (req, res) {

  var name = req.body.name;
	var password = req.body.password;

	console.log('Just to make sure I get: '+username+" "+password);

	if(name.length === 0) {
		res.redirect('/?message=' + encodeURIComponent("Please fill out your email address."));
		return;
	}

	if(password.length === 0) {
		res.redirect('/?message=' + encodeURIComponent("Please fill out your password."));
		return;
	}

	Waiter.findOne({
		where: {
			name: name
		}
	}).then(function(waiter){

			if(waiter!== null && password === waiter.password){
        req.session.user = user;
				res.redirect('/myprofile');
			} else {
				res.redirect('/?message=' + encodeURIComponent('Invalid email or password.'));
			}
	});
});

//ROUTE 02: CREATING NEW USER IN SIGNUP-------------
app.get('/signup', function(req, res){
	res.render("signup");
})

app.post('/signup', function(req, res){

	var inputname = req.body.name
  var inputemail = req.body.email
	var inputpassword = req.body.password

	console.log("I am receiving following waiter credentials: "+inputname+" "+inputpassword);

			Waiter.create({
				name: inputname,
				password: hash
			}).then( () => {
				res.redirect('/?message=' + encodeURIComponent("Your waiter got successfully created. Log in below."));
			});
})

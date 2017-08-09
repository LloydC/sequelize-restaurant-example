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

const sequelize = new Sequelize('sequelize_restaurant',process.env.POSTGRES_USER,null,{
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

const Order = sequelize.define('orders',{
  menuOrder:{
    type: Sequelize.STRING
  },
  drinkOrder:{
    type: Sequelize.STRING
  }
})

// const Table = sequelize.define('tables',{
//   name:{
//     type: Sequelize.STRING
//   }
// },{
//   timestamps: false
// })

// TABLES RELATIONSHIP/ASSOCIATION

// Waiter.hasMany(Table)
Waiter.hasMany(Order)
// Table.hasMany(Order)
// Table.belongsTo(Waiter)
Order.belongsTo(Waiter)
// Order.belongsTo(Table)

//----------------ROUTES----------------

//ROUTE 01: HOME------------------------
app.get('/', function(req, res){

	var waiter = req.session.waiter

	res.render("home", {waiter: waiter})

});

//ROUTE 02: CHECKING IF FORM INPUT USERDATA MATCHES DATABASE ENTRY. IF YES, ASSIGN SESSION TO USER.
app.post('/', function (req, res) {

  var name = req.body.name;
	var password = req.body.password;

	console.log('Just to make sure I get: '+name+" "+password);

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
        req.session.waiter = waiter;
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
        email: inputemail,
				password: inputpassword
			}).then( () => {
				res.redirect('/?message=' + encodeURIComponent("Your waiter got successfully created. Log in below."));
			});
})

app.get('/myprofile', (req,res)=>{
  const waiter = req.session.waiter
  res.render('profile',{waiter: waiter})
})

//ROUTE 03: ENTERING AN ORDER-------------
app.get('/addorder', function (req, res) {

	const waiter = req.session.waiter;

	if (waiter === undefined) {
		res.redirect('/?message=' + encodeURIComponent("Please log in as waiter to add a new order."));
	} else {
		res.render("addorder");
	}
});
app.post('/addorder', function(req, res) {

	var waiter = req.session.waiter.name;
	var inputMenu = req.body.menuOrder;
  var inputDrink = req.body.menuDrink;

	Waiter.findOne({
		where: {
			name: waiter
		}
	})
	.then(function(waiter){
		return waiter.createOrder({
			menuOrder: inputMenu,
      menuDrink: inputDrink
		})
	})
	.then( order => {
		res.redirect(`/orders/${order.id}`);
	})
});

//ROUTE 04: DISPLAYING SINGLE ORDER PAGE INCLUDING WAITER NAME

app.get('/orders/:orderId', function(req, res){

	const orderId = req.params.orderId;
	console.log('This is what I receive as orderId get request: '+orderId);

	Order.findOne({
		where: {
			id: orderId
		},
		include: [{
			model: Waiter
		}]
	})
	.then(function(order){
		// console.log(JSON.stringify(post, null, 2));
		console.log(order)
		console.log(order.waiter);
		console.log('Waiterdata: '+order.waiter.name);
		res.render("order", {menuOrder: order.menuOrder,menuDrink: order.menuDrink, orderId: orderId, name: order.waiter.name});
	})
});

sequelize.sync({force: false})

var server = app.listen(3002, function(){
  console.log("App listening on port 3002")
})

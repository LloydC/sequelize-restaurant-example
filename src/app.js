const Sequelize = require('sequelize')
const express = require('express')
const session = require('express-session')
// const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const SequelizeStore = require('connect-session-sequelize')(session.Store);

// CONFIG dependencies
const app = express()

const sequelize = new Sequelize('sequelize_restaurant',process.env.POSTGRES_USER,null,{
  host: 'localhost',
  dialect: 'postgres',
  storage: './session.postgres'
})
app.use(express.static('public'))

app.set('views','./views')
app.set('view engine','pug')

// app.use(cookieParser())
app.use(bodyParser.urlencoded({extended: true}))
app.use(session({
  store: new SequelizeStore({
    db: sequelize,
    checkExpirationInterval: 15 * 60 * 1000, // The interval at which to cleanup expired sessions in milliseconds.
    expiration: 24 * 60 * 60 * 1000 // The maximum age (in milliseconds) of a valid session.
  }),
  secret: "safe",
  saveUnitialized: true,
  resave: false
}))
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
Waiter.hasMany(Order)
Order.belongsTo(Waiter)

// Waiter.hasMany(Table)
// Table.hasMany(Order)
// Table.belongsTo(Waiter)

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

app.get('/logout', (req,res)=>{
  req.session.destroy(function(error) {
		if(error) {
			throw error;
		}
		res.redirect('/?message=' + encodeURIComponent("Successfully logged out."));
	})
})

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
  console.log('Waiter info '+ waiter)
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
      drinkOrder: inputDrink
		})
	})
	.then( order => {
		res.redirect(`/orders/${order.id}`); // === '/orders/' + order.id
	})
});

//ROUTE 04: DISPLAYING SINGLE ORDER PAGE INCLUDING WAITER NAME

app.get('/orders/:orderId', function(req, res){

	const orderId = req.params.orderId;
	// console.log('This is what I receive as orderId get request: '+orderId);

	Order.findOne({
		where: {
			id: orderId
		},
		include: [{
			model: Waiter
		}]
	})
	.then(function(order){
		console.log(order)
		console.log(order.waiter);
		console.log('Waiterdata: '+order.waiter.name);
		res.render("order", {menuOrder: order.menuOrder, menuDrink: order.drinkOrder, orderId: orderId, name: order.waiter.name});
	})
});

//ROUTE 05: DISPLAYING ALL ORDERS PAGE
app.get('/orders', function(req,res){
  Order.findAll({
    include: [{
    model: Waiter
  }]
  })
  .then((orders)=>{
    console.log(orders)
    res.render('orders',{ordersList: orders})
  })
})

app.get('/editOrder/:orderId', function(req,res){
  let orderId = req.params.orderId
  res.render('editOrder',{orderId: orderId})
})

// ROUTE 06: EDIT AN ORDER
app.post('/editOrder/:orderId', function(req,res){
  let orderId = req.params.orderId
  let waiterId = req.session.waiter.id

  const inputMenu = req.body.menuOrder;
  const inputDrink = req.body.menuDrink;

  Order.update({
      id: orderId,
      menuOrder: inputMenu,
      drinkOrder: inputDrink,
      waiterId: waiterId
    },{
      where: {
        id: orderId
      }
    })
  .then(() => {
    res.redirect(`/orders/${orderId}`);
  })

})

// ROUTE 07 DELETE AN ORDER

app.get('/deleteOrder/:orderId', function(req,res){
  let orderId = req.params.orderId
  let waiterId = req.session.waiter.id

  Order.destroy({
    where:{
      id: orderId
    }
  })
  .then(()=>{
    res.redirect('/orders')
  })
})

//ROUTE 08: CHAT ROOM FOR WAITERS TO CHAT
// app.get('/chat',(req,res)=>{
//   res.render('chatroom')
// })

sequelize.sync({force: false})

var server = app.listen(3000, function(){
  console.log("App listening on port 3000")
})

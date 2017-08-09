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

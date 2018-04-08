// source: https://www.youtube.com/watch?v=R6LUMXrAoCE (Many thanks for that great tutorial)

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path'); // core module, doesnt need to be installed
const nodeCouchDb = require('node-couchdb'); // see: https://www.npmjs.com/package/node-couchdb

// Hook Up couchDB Database to Node (authenticate to DB)
const couch = new nodeCouchDb({
    auth: {
        user: 'secondadmin',
        password: 'greatpassword'
    }
});

const dbName = 'customers';
const viewUrl = '_design/all_customers/_view/all';

// List all available databases
couch.listDatabases().then(
    function (dbs) {
        console.log(dbs);
    }
);

const app = express();

// View Engine Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
// Startpage
app.get('/', function (req, res) {
    // render the index view
    // res.render('index');
    couch.get(dbName, viewUrl).then(
        function (data, headers, status) {
            console.log(data.data.rows);
            res.render('index', {
                customers: data.data.rows
            });
        }, function (err) {
            res.send(err);
        });
});

// Creating a customer
app.post('/customer/add', function (req, res) {
    const name = req.body.name;
    const email = req.body.email;

    // generate an unique uid
    couch.uniqid().then(function (ids) {
        const id = ids[0];
        couch.insert('customers', {
            _id: id,
            name: name,
            email: email
        }).then(
            function (data, headers, status) {
                res.redirect('/');
            },
            function (err) {
                res.send(err);
            });
    });
});

// Deleting a customer
app.post('/customer/delete/:id', function (req, res) {
    const id = req.params.id; // comes from URL
    const rev = req.body.rev; // comes from body (hidden-field)

    couch.del(dbName, id, rev).then(
        function (data, headers, status) {
            res.redirect('/');
        }, function (err) {
            res.send(err);
        });
});

// Updating a customer
app.post('/customer/update', function (req, res) {
    const id = req.body.customerID;
    const name = req.body.name;
    const email = req.body.email;

    // query rev from document by id
    couch.get(dbName, id).then(function (data, headers, status) {
        const rev = data.data._rev;

        // updating fields in couchdb 
        couch.update(dbName, {
            _id: id,
            _rev: rev,
            name: name,
            email: email
        }).then(function(data, headers, status){
            res.redirect('/');
        }, function(err){
            res.send(err);
        });
    }, function (err) {
        res.send(err);
    });
})

// Start the server
app.listen(3000, function () {
    console.log('Server started on Port 3000');
});

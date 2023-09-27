const express = require("express");
const app = express();
const cors = require("cors");
const mongodb = require("mongodb");
const dotenv = require("dotenv").config();
const mongoClient = mongodb.MongoClient;
const URL = process.env.DB;
const password = process.env.password;
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const rn = require('random-number');


const options = {
    min: 1000,
    max: 9999,
    integer: true
}
const secret = process.env.SECRET;
app.use(express.json());
app.use(cors({
    origin: "https://strong-sable-ed5be0.netlify.app/"
}))



const authorize = (req, res, next) => {
    if (req.headers.authorization) {
        try {
            const verify = jwt.verify(req.headers.authorization, secret);
            if (verify) {
                next();
            }
        } catch (error) {
            res.status(401).json({ message: "Unauthorized" });
        }
    } else {
        res.status(401).json({ message: "Unauthorized" });
    }
}

//for registration
app.post('/register', async (req, res) => {

    try {

        let connection = await mongoClient.connect(URL);
        let db = connection.db('library');
        const collection = db.collection("register")
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(req.body.password, salt);
        req.body.password = hash;
        const operations = await collection.insertOne({ ...req.body, isDeleted: false })
        await connection.close();
        res.json({ message: "customer created" })
    } catch (error) {
        // console.log('customer error')
        console.log(error)
    }

})

//Add users
app.post('/adduser', authorize, async (req, res) => {

    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db('library');
        await db.collection('register').insertOne(req.body);
        connection.close();
        res.json({ message: "User created" })
    } catch (error) {
        console.log(error)
    }

})

//to get register user detail
app.get('/user', authorize, async function (req, res) {

    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db('library');
        let users = await db.collection("register").find({ role: "user" }).toArray();
        // res.json({ message: "success" })
        res.json(users)
        await connection.close()


    } catch (error) {
        console.log('userlist error')
        console.log(error)
    }

})


//for login
app.post('/login', async (req, res) => {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db('library');
        const collection = db.collection("register");
        const user = await collection.findOne({ email: req.body.email });

        if (user) {
            let passwordResult = await bcrypt.compare(req.body.password, user.password);
            if (passwordResult) {
                const token = jwt.sign({ userid: user._id }, secret, { expiresIn: '1h' })
                console.log(token)
                console.log(user)
                res.json({ message: "Login Success", token, user })

            }
            else {
                res.status.apply(401).json({ message: "Email id or password do not match" })
            }
        } else {
            res.status(401).json({ message: "Email id or password donot match" });
        }
    } catch (error) {
        console.log(error)
    }
})


// to get particular user
app.get('/user/:id', authorize, async (req, res) => {


    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db('library');
        let objId = new mongodb.ObjectId(req.params.id)
        let users = await db.collection("register").findOne({ _id: objId });
        res.json(users);
        await connection.close()
    } catch (error) {
        console.log('User Not Found')
        console.log(req.params.id)
        console.log(error)
    }
})


app.get('/Userdata/:id', authorize, async (req, res) => {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db('crm');
        let objId = mongodb.ObjectId(req.params.id)
        let users = await db.collection("crmtask").findOne({ _id: objId });
        res.json(users);
        await connection.close()

    } catch (error) {
        console.log('User Not Found')
    }
})
//to fetch particular users detail
// app.get('/username/:id', authorize, async (req, res) => {


//     try {
//         let connection = await mongoClient.connect(URL);
//         let db = connection.db('library');
//         let objId = new mongodb.ObjectId(req.params.id)
//         let users = await db.collection("register").findOne({ fname: req.params.id });
//         res.json(users);
//         await connection.close()
//     } catch (error) {
//         console.log('User Not Found')
//         console.log(req.params.id)
//         console.log(error)
//     }
// })


//To edit particular user
app.put('/users/:id', authorize,
    async function (req, res) {
        try {
            let connection = await mongoClient.connect(URL);
            let db = connection.db('library');
            let objId = mongodb.ObjectId(req.params.id);

            let user = await db.collection('register').findOneAndUpdate({ _id: objId }, {
                $set:
                {
                    fname: req.body.fname,
                    lname: req.body.lname,
                    email: req.body.email,
                    phone: req.body.phone,
                }
            });
            res.json({ message: 'user updated' }
            )

        } catch (error) {
            console.log('user update error')
            console.log(error)
        }
    })

//to delete user
app.delete('/userdel/:id', authorize, async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db('library');
        let objId = mongodb.ObjectId(req.params.id)
        await db.collection("register").deleteOne({ _id: objId })
        await connection.close();
        res.json({ message: "user deleted" });
    } catch (error) {
        console.log('error')
    }
})


//add book
app.post('/books', authorize, async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db('library');
        await db.collection('books').insertOne(req.body);
        connection.close();
        res.json({ message: "Book created" })
    } catch (error) {
        console.log('error')
        console.log(error)
    }


})


//View Book
app.get('/books', authorize, async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db('library');
        let users = await db.collection("books").find({}).toArray();
        res.json(users);
        await connection.close()
    } catch (error) {
        console.log(error)
    }
})

//to delete book
app.delete('/books/:id', authorize, async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db('library');
        let objId = mongodb.ObjectId(req.params.id)
        await db.collection("books").deleteOne({ _id: objId })
        await connection.close();
        res.json({ message: "Book deleted" });
    } catch (error) {
        console.log(error)
    }
})

//View Particular book details
app.get('/books/:id', authorize, async (req, res) => {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db('library');
        let objId = mongodb.ObjectId(req.params.id)
        let users = await db.collection("books").findOne({ _id: objId });
        res.json(users);
        await connection.close()
    } catch (error) {
        console.log(error)
    }
})


//Edit Particular book details
app.put('/books/:id', authorize,
    async function (req, res) {
        try {
            let connection = await mongoClient.connect(URL);
            let db = connection.db('library');
            let objId = mongodb.ObjectId(req.params.id);

            let user = await db.collection('books').findOneAndUpdate({ _id: objId }, {
                $set:
                {
                    bkname: req.body.bkname,
                    author: req.body.author,
                    year: req.body.year,
                    available: req.body.available
                }

            });
            res.json({ message: 'user updated' }
            )

        } catch (error) {
            console.log(error)
        }
    })


//Withdraw the book 
app.post('/withdraw', authorize, async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db('library');
        await db.collection('withdraw').insertOne(req.body);
        connection.close();
        res.json({ message: "Withdraw done" })
    } catch (error) {
        console.log(error)
    }


})

//view the withdraw details
app.get('/withdraw', authorize, async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db('library');
        let users = await db.collection("withdraw").find({}).toArray();
        res.json(users);
        await connection.close()
    } catch (error) {
        console.log(error)
    }
})

//to delete withdraw details
app.delete('/dwithdraw/:id', authorize, async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db('library');
        let objId = mongodb.ObjectId(req.params.id)
        await db.collection("withdraw").deleteOne({ _id: objId })
        await connection.close();
        res.json({ message: "Deleted" });
    } catch (error) {
        console.log('error')
    }
})
//view particular withdraw details
app.get('/withdraw/:id', authorize, async (req, res) => {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db('library');
        let objId = mongodb.ObjectId(req.params.id)
        let users = await db.collection("withdraw").findOne({ _id: objId });
        res.json(users);
        await connection.close()
    } catch (error) {
        console.log(error)
    }
})


//Edit Particular withdraw details
app.put('/editwithdraw/:id', authorize,
    async function (req, res) {
        try {
            let connection = await mongoClient.connect(URL);
            let db = connection.db('library');
            let objId = mongodb.ObjectId(req.params.id);

            let user = await db.collection('withdraw').findOneAndUpdate({ _id: objId }, {
                $set:
                {
                    fname: req.body.fname,
                    phone: req.body.phone,
                    bkname: req.body.bkname,
                    author: req.body.author,
                    date: req.body.date,
                   
                }

            });
            res.json({ message: ' updated' }
            )

        } catch (error) {
            console.log(error)
        }
    })

// to get particular book details of user
app.get('/userbooks/:id', authorize, async (req, res) => {
    console.log(req.params.id)
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db('library');
        let users = await db.collection("withdraw").find({userid: req.params.id }).toArray();
        res.json(users);
        console.log(users)
        await connection.close()
    } catch (error) {
        console.log(error)
    }
})


//forgot password
app.post('/mail', async function (req, res) {

    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db('library');
        let user = await db.collection("register").findOne({ email: req.body.email });
        res.json(user)
        if (user) {
            let randomnum = rn(options)
            await db.collection('register').updateOne({ email: req.body.email }, { $set: { rnum: randomnum } });
            var sender = nodemailer.createTransport({
                service: "gmail",
                host: "smtp.gmail.com",
                secure: false,
                auth: {
                    user: 'sandhyadevi0229@gmail.com',
                    pass: password
                }
            });

            var composemail = {
                from: "sandhyadevi0229@gmail.com",
                to: `${req.body.email}`,
                subject: 'send mail using node js',
                text: `${randomnum}`,


            };

            sender.sendMail(composemail, function (error, info) {
                if (error) {
                    console.log(error);
                    res.json({
                        message: "Error"
                    })
                } else {
                    console.log('Email sent: ' + info.response);
                    res.json({
                        message: "Email sent"
                    })
                }
            });
        }
        else {
            res.status(400).json({ message: 'User not found' })
        }
    }
    catch (err) {
        console.log(err)
    }


})

//verification
app.post('/verification/:id', async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db('library');
        let objId = mongodb.ObjectId(req.params.id)
        let user = await db.collection('register').findOne({ _id: objId });
        if (user.rnum == req.body.vercode) {
            res.status(200).json(user)
        }
        else {
            res.status(400).json({ message: "Invalid Verification Code" })
        }
    }
    catch (error) {
        console.log('error')
    }
})


//Update Password
app.post('/ChangePassword/:id', async function (req, res) {
    try {

        const connection = await mongoClient.connect(URL);
        const db = connection.db('library');
        let objId = mongodb.ObjectId(req.params.id)
        const salt = await bcrypt.genSalt(10);
       
        const hash = await bcrypt.hash(req.body.password1, salt);
      
        req.body.password1 = hash;
        let user = await db.collection('register').findOneAndUpdate({ _id: objId }, { $set: { "password": req.body.password1 } })
        console.log(user)
     let users=  await db.collection('register').findOneAndUpdate({ _id: objId }, { $unset: { "rnum": 1 } });
    await   db.collection('register').findOneAndUpdate({ _id: objId }, { $unset: { "password1": 1 } });
 await   db.collection('register').findOneAndUpdate({ _id: objId }, { $unset: { "password2": 1 } });
     
        await connection.close();
        res.json({ message: "Password updated successfully" })
    } catch (error) {
        console.log(error);
    }
})


//app.listen(8000)
app.listen(process.env.PORT || 8000);
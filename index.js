const express = require('express');
require('dotenv').config();
const { connect } = require('./MongoUtil');
const cors = require('cors');
const { ObjectId } = require('mongodb');
const app = express();
const jwt = require('jsonwebtoken');
const { validateProduct, validateParamsQuery, validateReview, validateSignup, validateLogin, validateUserUpdate, } = require('./validator');
const bcrypt = require('bcryptjs');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use(express.json());
app.use(cors());

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;
// const YOUR_DOMAIN = process.env.DOMAIN;

function jwtAuthentication(req,res,next) {
    if(req.headers.authorization) {
        const headers = req.headers.authorization;
        const token = headers.split(' ')[1];

        jwt.verify(token, process.env.TOKEN_SECRET, function(err, tokenData){
            if(err) {
                res.status(403).json({
                    'error': "Your access token is invalid"
                })
                return;
            }
            req.user = tokenData;
            next();
        })
    } else {
        res.status(403).json({
            'error': "You must provide an access token to access this route"
        })
    }
}

function validator(data,req,res) {
    const { error, value } = data(req);
    if(error) return res.status(422).json((error.details).map(e => e.message));
}

async function main() {
    const db = await connect(MONGO_URI, DB_NAME);

    // ADD NEW PRODUCT
    app.post('/add',[jwtAuthentication],async function (req,res) {
        // VALIDATE BODY
        if(validator(validateProduct,req.body,res)) return res;

        const result = await db.collection('earphone').insertOne({
            'brandModel': req.body.brandModel,
            'type': req.body.type,
            'earbuds': req.body.earbuds,
            'bluetooth': req.body.bluetooth,
            'price': req.body.price,
            "stock": req.body.stock,
            'color': req.body.color,
            'hours': req.body.hours,
            'dustWaterproof': req.body.dustWaterproof,
            'connectors': req.body.connectors,
            'image': req.body.image,
        })

        res.status(201).json({
            'result': result,
            'message': 'Created successfully'
        });
    })
    
    // SEARCH FOR PRODUCT
    app.get('/earphone',async function(req,res){
        // VALIDATE QUERY
        if(validator(validateParamsQuery,req.query,res)) return res;

        try {   
            // PAGINATION
            let { page = 1, limit = 20 } = req.query;
            let criteria = {};
    
            if(req.query.type) {
                criteria.type = {
                    '$regex': req.query.type, '$options': 'i'
                }
            }
    
            if(req.query.otherType) {
                criteria.type = {
                    '$ne': req.query.otherType
                }
            }
    
            if(req.query.otherMusicHours) {
                criteria['hours.music'] = {
                    '$not': {
                        '$eq': parseInt(req.query.otherMusicHours)
                    }
                }
            }
    
            if(req.query.store) {
                criteria.stock = {
                    '$elemMatch': {
                        'store': req.query.store
                    }
                }
            }
    
            if(req.query.color) {
                criteria.color = {
                    '$in': [req.query.color]
                }
            }
    
            if(req.query.otherColor) {
                criteria.color = {
                    '$nin': [req.query.otherColor]
                }
            }
    
            if(req.query.min_price) {
                criteria.price = {
                    '$gte': parseInt(req.query.min_price)
                }
            }
    
            if(req.query.max_price) {
                criteria.price = {
                    '$lte': parseInt(req.query.max_price)
                }
            }
    
            const result = await db.collection('earphone').find(criteria, {
                'projection': {
                    '_id': 1,
                    'image': 1,
                    'earbuds': 1,
                    'brandModel': 1,
                    'type': 1,
                    'bluetooth': 1,
                    'price': 1,
                    'stock': 1,
                    'color': 1,
                    'hours': 1,
                    'dustWaterproof': 1,
                    'connectors': 1
                }
            }).limit(limit * 1).skip((page - 1) * limit).toArray();
    
            res.status(200).json({
                page, limit, result
            });
        } catch(err) {
            res.status(404).end('Server could not find what was requested');
        }
    })

    // GET A PRODUCT
    app.get('/earphone/:id',async function(req,res){
        // VALIDATE PARAMS
        if(validator(validateParamsQuery,req.params,res)) return res;

        try {
            const result = await db.collection('earphone').findOne({
                '_id': ObjectId(req.params.id)
            })

            // EARPHONE ID NOT FOUND
            if(result === null) throw err;

            res.status(200).send(result);
        } catch(err) {
            res.status(400).end('Any modifications are needed')
        }
    })

    // UPDATE DETAILS OF PRODUCT
    app.put('/earphone/:id',[jwtAuthentication],async function(req,res){
        try {
            // VALIDATE BODY
            if(validator(validateProduct,req.body,res)) return res;

            const earphone = await db.collection('earphone').findOne({
                '_id': ObjectId(req.params.id)
            })

            // EARPHONE ID NOT FOUND
            if(earphone == null) throw err;

            await db.collection('earphone').updateOne({
                '_id': ObjectId(req.params.id)
            },{
                '$set': {
                    'brandModel': req.body.brandModel ? req.body.brandModel : earphone.brandModel,
                    'type': req.body.type ? req.body.type : earphone.type,
                    'earbuds': req.body.earbuds ? req.body.earbuds : earphone.earbuds,
                    'bluetooth': req.body.bluetooth ? req.body.bluetooth : earphone.bluetooth,
                    'price': req.body.price ? req.body.price : earphone.price,
                    'stock': req.body.stock ? req.body.stock : earphone.stock,
                    'color': req.body.color ? req.body.color : earphone.color,
                    'hours': req.body.hours ? req.body.hours : earphone.hours,
                    'dustWaterproof': req.body.dustWaterproof ? req.body.dustWaterproof : earphone.dustWaterproof,
                    'connectors': req.body.connectors ? req.body.connectors : earphone.connectors,
                    'image': req.body.image ? req.body.image : earphone.image,
                }
            })

            const result = await db.collection('earphone').findOne({
                '_id': ObjectId(req.params.id)
            })

            res.status(200).json({
                'result': result,
                'message': 'Updated succesfully'
            });
        } catch(err) {
            res.status(400).end('Any modifications are needed')
        }
    })

    // DELETE PRODUCT
    app.delete('/earphone/:id',[jwtAuthentication],async function(req,res){
        // VALIDATE PARAMS
        if(validator(validateParamsQuery,req.params,res)) return res;
       
        try {
            const result = await db.collection('earphone').deleteOne({
                '_id': ObjectId(req.params.id)
            })
            
            // NO EARPHONE ID TO DELETE
            if(result.deletedCount === 0) throw err;

            res.status(200).json({
                'message': 'Deleted successfully'
            });
        } catch(err) {
            res.status(400).end('Any modifications are needed')
        }
    })

    // ADD PRODUCT REVIEW 
    app.post('/earphone/:id/review',async function(req,res){
        // VALIDATE BODY
        if(validator(validateReview,req.body,res)) return res;

        try {
            const result = await db.collection('earphone').updateOne({
                '_id': ObjectId(req.params.id)
            },{
                '$push': {
                    'review': {
                        '_id': ObjectId(),
                        'email': req.body.email,
                        'comments': req.body.comments,
                        'rating': req.body.rating,
                        'date': new Date()
                    }
                }
            })

            // NO REVIEW ID TO DELETE
            if(result.modifiedCount === 0) throw err;
        
            res.status(201).json({
                'result': result,
                'message': 'Created successfully'
            })
        } catch(err) {
            res.status(400).end('Any modifications are needed')
        }
    })

    // GET A PRODUCT REVIEW
    app.get('/earphone/:id/review',async function(req,res){
        // VALIDATE PARAMS
        if(validator(validateParamsQuery,req.params,res)) return res;

        try {
            const result = await db.collection('earphone').findOne({
                '_id': ObjectId(req.params.id)
            },{
                'projection': {
                    '_id': 1,
                    'brandModel': 1,
                    'review': 1
                }
            })

            // EARPHONE ID NOT FOUND
            if(result === null) throw err;

            res.status(200).send(result);
        } catch(err) {
            res.status(400).end('Any modifications are needed')
        }
    })

    // EDIT THE REVIEW
    app.put('/earphone/:id/review/:reviewid',async function(req,res){
        // VALIDATE BODY
        if(validator(validateReview,req.body,res)) return res;

        try {
            const review = await db.collection('earphone').findOne({
                '_id': ObjectId(req.params.id),
                'review._id': ObjectId(req.params.reviewid)
            },{
                'projection': {
                    'review.$': 1,
                }
            })

            // NO IDs FOUND
            if(!review) throw err;

            await db.collection('earphone').updateOne({
                '_id': ObjectId(req.params.id),
                'review._id': ObjectId(req.params.reviewid)
            },{
                '$set': {
                    'review.$.email': req.body.email ? req.body.email : review.email,
                    'review.$.comments': req.body.comments ? req.body.comments : review.comments,
                    'review.$.rating': req.body.rating ? req.body.rating : review.rating,
                    'review.$.date': req.body.date ? new Date(req.body.date) : new Date()
                }
            })

            const result = await db.collection('earphone').findOne({
                '_id': ObjectId(req.params.id),
                'review._id': ObjectId(req.params.reviewid)
            },{
                'projection': {
                    'review.$': 1,
                }
            })

            res.status(200).json({
                'result': result,
                'message': 'Updated succesfully'
            });
        } catch(err) {
            res.status(400).end('Any modifications are needed')
        }
    })

    // DELETE REVIEW
    app.delete('/earphone/:id/review/:reviewid',async function(req,res){
        // VALIDATE PARAMS
        if(validator(validateParamsQuery,req.params,res)) return res;
        
        try {
            const result = await db.collection('earphone').updateOne({
                '_id': ObjectId(req.params.id)
            },{
                '$pull': {
                    'review': {
                        '_id': ObjectId(req.params.reviewid)
                    }
                }
            })

            // NO REVIEW ID TO DELETE
            if(result.modifiedCount === 0) throw err;

            res.status(200).json({
                'message': 'Deleted succesfully'
            });
        } catch(err) {
            res.status(400).end('Any modifications are needed')
        }
    })

    // GET USER'S REVIEW FROM PRODUCT
    app.get('/user/:id/:email/review',async function(req,res){
        // VALIDATE QUERY
        if(validator(validateParamsQuery,req.query,res)) return res;
        
        // PAGINATION
        let { page = 1, limit = 20 } = req.query;

        try {
            const result = await db.collection('user').aggregate([
                { $match: { _id: ObjectId(req.params.id)} },
                { $lookup: {
                    from: "earphone",
                    localField: "email",
                    foreignField: "review.email",
                    as: "userAllReviews"
                }},
                { $unwind: "$userAllReviews" },
                { $unwind: "$userAllReviews.review" },
                { $match: {'userAllReviews.review.email': req.params.email} },
                { $project: {
                        'userAllReviews.brandModel': 1,
                        'userAllReviews.review': 1
                }},
                { $skip: parseInt(page - 1) * limit },
                { $limit: limit * 1 },
            ]).toArray();
            
            // IF USER ID OR EMAIL OR REVIEW NOT FOUND
            if(!result || result.length === 0) throw err;

            res.status(200).json({
                page, limit, result
            });
        } catch(err) {
            res.status(404).end('Any modifications are needed or no review')
        }
    })

    // GET USERS
    app.get('/user',async function(req,res){
        // VALIDATE PARAMS
        if(validator(validateParamsQuery,req.params,res)) return res;

        const result = await db.collection('user').find({},{
            'projection': {
                '_id': 1,
                'username': 1,
                'firstname': 1,
                'lastname': 1,
                'email': 1
            }
        }).toArray()

        res.status(200).json(result);
    })

    // GET A USER
    app.get('/user/:id',async function(req,res){
        // VALIDATE PARAMS
        if(validator(validateParamsQuery,req.params,res)) return res;

        try {
            const result = await db.collection('user').findOne({
                '_id': ObjectId(req.params.id)
            },{
                'projection': {
                    '_id': 1,
                    'username': 1,
                    'firstname': 1,
                    'lastname': 1,
                    'email': 1
                }
            })

            // USER ID NOT FOUND
            if(result === null) throw err;

            res.status(200).send(result);
        } catch(err) {
            res.status(400).end('Any modifications are needed')
        }
    })

    // SIGNUP USER
    app.post('/signup',async function(req,res){
        // VALIDATE BODY
        if(validator(validateSignup,req.body,res)) return res;

        const emailExist = await db.collection('user').findOne({
            'email': req.body.email
        })

        // CHECK EXISTING EMAIL
        if(emailExist) return res.status(422).json({
            'message': `${req.body.email} is already been registered`
        })

        // HASH THE PASSWORD
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        await db.collection('user').insertOne({
            'username': req.body.username,
            'firstname': req.body.firstname,
            'lastname': req.body.lastname,
            'email': req.body.email,
            'password': hashedPassword
        })

        res.status(201).json({
            'message': `${req.body.email} is registered successfully`
        });
    })

    // LOGIN
    app.post('/login',async function(req,res){
        // VALIDATE BODY
        if(validator(validateLogin,req.body,res)) return res;

        const user = await db.collection('user').findOne({
            'email': req.body.email
        })

        // EMAIL NOT VALID
        if(!user) return res.status(422).json({
            'message': 'Invalid email or password'
        });

        // COMPARE HASHING PASSWORD
        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if(!validPassword) return res.status(422).json({
            'message': 'Invalid email or password'
        });

        // DISTRIBUTE TOKEN
        if(user) {
            const token = jwt.sign({
                'username': req.body.username,
                'firstname': req.body.firstname,
                'lastname': req.body.lastname
            },process.env.TOKEN_SECRET,{
                'expiresIn': '30m'
            })
            res.json({
                '_id': user._id,
                'username': user.username,
                'firstname': user.firstname,
                'lastname': user.lastname,
                'email': user.email,
                'token': token
            })
        } else {
            res.sendStatus(401)
        }
    })

    // UPDATE USER
    app.put('/user/:id',[jwtAuthentication],async function(req,res){
        // VALIDATE BODY
        if(validator(validateUserUpdate,req.body,res)) return res;

        try {
            const user = await db.collection('user').findOne({
                '_id': ObjectId(req.params.id)
            })

            // NO USER ID FOUND
            if(!user) throw err;

            await db.collection('user').updateOne({
                '_id': ObjectId(req.params.id)
            },{
                '$set': {
                    'username': req.body.username ? req.body.username : user.username,
                    'firstname': req.body.firstname ? req.body.firstname : user.firstname,
                    'lastname': req.body.lastname ? req.body.lastname : user.lastname
                }
            })

            const result = await db.collection('user').findOne({
                '_id': ObjectId(req.params.id)
            })

            res.status(200).json({
                'result': result,
                'message': 'Updated succesfully'
            });
        } catch(err) {
            res.status(400).end('Any modifications are needed')
        }
    })

    // DELETE USER
    app.delete('/user/:id',[jwtAuthentication],async function(req,res){
        // VALIDATE PARAMS
        if(validator(validateParamsQuery,req.params,res)) return res;
        
        try {
            const result = await db.collection('user').deleteOne({
                '_id': ObjectId(req.params.id)
            })
            
            // NO USER ID TO DELETE
            if(result.deletedCount === 0) throw err;

            res.status(200).json({
                'message': 'Deleted successfully'
            });
        } catch(err) {
            res.status(400).end('Any modifications are needed')
        }
    })

    // CHECKOUT
    // app.post('/checkout', async function(req,res) {
        
    //     const lineItems = [];
    //     for (let item of req.body.items) {
    //         // console.log(item._id)
    //         // find the item by its id (note: should be from mongodb for a real project)
    //         // const product = products.find(p => p._id == item._id);

    //         // const product = await db.collection('earphone').findOne({'_id': req.body.items._id})
                        
    //         // create the line item
    //         const lineItem = {
    //             "quantity": item.quantity,
    //             "price_data": {
    //                 "product_data": {
    //                     "name": product.brandModel,
    //                     "metadata": {
    //                         "_id": product._id
    //                     }
    //                 },
    //                 "unit_amount_decimal": product.price,
    //                 "currency": "SGD"
    //             },
    //         };
    //         lineItems.push(lineItem)
    //     }
    //     res.json(lineItems)
            
    //     // create the stripe session
    //     const stripeSession = await stripe.checkout.sessions.create({
    //         line_items: lineItems,
    //         payment_method_types: ['card'],
    //         mode: 'payment',
    //         success_url: `${YOUR_DOMAIN}/success`,
    //         cancel_url: `${YOUR_DOMAIN}/cancel`,
    //     });

    //     res.json({
    //         'sessionId': stripeSession.id,
    //         'publishableKey': process.env.STRIPE_PUBLISHABLE_KEY
    //     })
    // })

    // THE 404 ROUTE
    app.all('*',function(req,res) {
        res.status(404).end('Server could not find what was requested');
    });
}
main();

app.listen(process.env.PORT || 3000, function () {
    console.log('Server started')
})
const Joi = require('joi');
const positiveInt = Joi.number().integer().positive();
const positiveNum =  Joi.number().positive();
const alphanum = Joi.string().alphanum();
const email = Joi.string().trim().email().regex(/^[a-z0-9-@._]+$/).required();
const password = Joi.string().trim().min(6).required();

const validator = (schema) => (payload) => schema.validate(payload, {
    abortEarly: false
});

const productSchema = Joi.object({
    _id: alphanum,
    brandModel: Joi.string().regex(/^[a-zA-Z0-9 ]+$/).required(),
    type: Joi.string().regex(/^[a-z-]+$/).required(),
    // earbuds: Joi.boolean(),
    earbuds: Joi.string().allow(null, ''),
    // bluetooth: positiveNum.less(6),
    bluetooth: Joi.string().allow(null, ''),
    price: positiveNum.required(),
    // stock: Joi.array().items(Joi.object({store: Joi.string(), qty: positiveInt})),
    stock: Joi.string().allow(null, ''),
    color: Joi.array().items(Joi.string()).required(),
    // hours: Joi.object({music: positiveInt, cableCharging: positiveInt, boxCharging: positiveInt.allow(0)}),
    hours: Joi.string().allow(null, ''),
    dustWaterproof: Joi.boolean(),
    connectors: Joi.string().regex(/^[a-z-]+$/).required(),
    image: Joi.string().regex(/^[a-z0-9-/.:]+$/)
})

const paramsQuerySchema = Joi.object({
    type: Joi.string().regex(/^[a-z-]+$/),
    otherType: Joi.string().regex(/^[a-z-]+$/),
    store: Joi.string().regex(/^[a-z]+$/),
    color: Joi.string().regex(/^[a-z]+$/),
    otherColor: Joi.string().regex(/^[a-z&,]+$/),
    otherMusicHours: Joi.number(),
    min_price: Joi.number(),
    max_price: Joi.number(),
    id: Joi.string().alphanum().trim(),
    reviewid: Joi.string().alphanum().trim(),
    limit: Joi.number().integer().positive(),
    page: Joi.number().integer().positive(),
    email: Joi.string().trim().email().regex(/^[a-z0-9-@._]+$/)
})

const reviewSchema = Joi.object({
    _id: alphanum,
    email: email,
    comments: Joi.string().required(),
    rating:  positiveInt.less(6)
})

const signupSchema = Joi.object({
    username: alphanum.required(),
    firstname: alphanum,
    lastname: alphanum,
    email: email,
    password: password,
    // comfirmPassword: Joi.ref('password')
})

const loginSchema = Joi.object({
    email: email,
    password: Joi.any()
})

const userUpdateSchema = Joi.object({
    _id: alphanum,
    username: alphanum.required(),
    firstname: alphanum,
    lastname: alphanum,
})

exports.validateSignup = validator(signupSchema);
exports.validateLogin = validator(loginSchema);
exports.validateUserUpdate = validator(userUpdateSchema);
exports.validateProduct = validator(productSchema);
exports.validateReview = validator(reviewSchema);
exports.validateParamsQuery = validator(paramsQuerySchema);
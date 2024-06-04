const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const Joi = require("joi");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();

const app = express();

app.use(bodyParser.json());

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected..."))
  .catch((err) => console.log(err));

const AccountSchema = new mongoose.Schema({
  name: String,
  balance: Number,
});

const Account = mongoose.model("Account", AccountSchema);

// Extended: https://swagger.io/specification/#infoObject
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: "Test Transaction in MongoDB",
      description: "Bank API",
      contact: {
        name: "Developer",
      },
      servers: ["http://localhost:3000"],
    },
  },
  // ['.routes/*.js']
  apis: ["server.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /account:
 *  post:
 *    tags:
 *      - Account
 *    description: Create account
 *    parameters:
 *      - in: body
 *        name: account
 *        description: The account to create.
 *        schema:
 *          type: object
 *          required:
 *            - name
 *            - balance
 *          properties:
 *            name:
 *              type: string
 *            balance:
 *              type: number
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.post("/account", async (req, res, next) => {
  const { name, balance } = req.body;

  let account = new Account({ name, balance });
  try {
    account = await account.save();
    res.send(account);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /account/{name}:
 *  get:
 *    tags:
 *      - Account
 *    description: Get account information
 *    parameters:
 *      - in: path
 *        name: name
 *        schema:
 *          type: string
 *        required: true
 *        description: Name of the account
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.get("/account/:name", async (req, res, next) => {
  const { name } = req.params;

  try {
    const account = await Account.findOne({ name });

    if (!account) {
      throw new Error("Account not found");
    }

    res.send(account);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /transfer:
 *  post:
 *    tags:
 *      - Transfer
 *    description: Transfer money apply transaction
 *    parameters:
 *      - in: body
 *        name: transfer
 *        description: The transfer to create.
 *        schema:
 *          type: object
 *          required:
 *            - from
 *            - to
 *            - amount
 *          properties:
 *            from:
 *              type: string
 *            to:
 *              type: string
 *            amount:
 *              type: number
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.post("/transfer", async (req, res, next) => {
  const schema = Joi.object({
    from: Joi.string().required(),
    to: Joi.string().required(),
    amount: Joi.number().positive().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return next(error);
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { from, to, amount } = req.body;

    const fromAccount = await Account.findOne({ name: from });
    const toAccount = await Account.findOne({ name: to });

    if (!fromAccount || !toAccount || fromAccount.balance < amount) {
      throw new Error("Invalid transaction");
    }

    fromAccount.balance -= amount;
    toAccount.balance += amount;

    await fromAccount.save({ session });
    await toAccount.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.send("Transfer successful");
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(400).send(err.message);
});

app.listen(process.env.PORT, () => {
  console.log("Server started on port 3000");
});

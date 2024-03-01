// user.js
const { getDbReference } = require("../lib/mongo");
const { ObjectId } = require('mongodb');
const bcrypt = require("bcryptjs");

const UserSchema = {
    name: { required: true },
    email: { required: true },
    password: { required: true },
    role: { required: true }
}

async function createUser(user) {
    const db = getDbReference();
    const collection = db.collection("users");

    user.password = await bcrypt.hash(user.password, 8);
    const result = await collection.insertOne(user);
    return result.insertedId;
}

async function getAllUsers() {
    const db = getDbReference();
    const collection = db.collection('users');
    const users = await collection.find().project({ password: 0 }).toArray();
    return users;
}


async function getUserById(id) {
    const db = getDbReference();
    const collection = db.collection("users");

    if (!ObjectId.isValid(id)) {
        return null;
    } else {
        const result = await collection.findOne({ _id: new ObjectId(id) });
        if (result) {
            delete result.password;
        }
        return result;
    }
}

async function getUserByEmail(email) {
    const db = getDbReference();
    const collection = db.collection("users");

    const result = await collection.findOne({ email: email });
    return result;
}

async function validateUser(email, password) {
    const user = await getUserByEmail(email);
    if (!user) {
        return null;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
        return user;
    } else {
        return null;
    }
}

module.exports = { createUser, getUserById, getUserByEmail, validateUser, getAllUsers };

const db = require('../models/model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userController = {};

const doesUserNameExist = async (username) => {
  const check = `
      SELECT * 
      FROM _user 
      WHERE username = $1
    `;
  const result = await db.query(check, [username]);
  return result;
};

userController.checkUser = async (req, res, next) => {
  try {
    //Deconstruct data from request body
    const { username } = req.body;
    const result = await doesUserNameExist(username);
    if (!result.rows.length) {
      next();
    } else {
      // user already exists
      return next({ error: 'Username already exists' });
    }
  } catch (error) {
    return next(error);
  }
};

userController.addUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const saltRounds = 10;

    const hashedPass = await bcrypt.hash(password, saltRounds);
    console.log('THIS IS HASHED PASS', hashedPass);
    const values = [username, hashedPass];
    const addQuery = `
        INSERT INTO
          _user (username, password) 
        VALUES 
          ($1, $2) 
        RETURNING *
      `;
    const addResult = await db.query(addQuery, values);
    res.locals.newUser = addResult.rows;
    console.log('THIS IS NEW USER', res.locals.newUser);
    next();
  } catch (error) {
    next(error);
  }
};

userController.loginUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const values = [username];
    const text = `
      SELECT *
      FROM _user
      WHERE username = $1
    `;
    const userExists = await db.query(text, values);
    console.log(userExists.rows);
    if (!userExists.rows.length) {
      return next({ error: 'User does not exist' });
    }
    const hash = userExists.rows[0].password;
    const compare = await bcrypt.compare(password, hash);
    if (!compare) {
      return next({ error: 'Incorrect password' });
    }
    res.locals.userInfo = {
      id: userExists.rows[0].id,
      profilePicture: userExists.rows[0].profile_picture,
    };
    return next();
  } catch (err) {
    return next({ error: 'Error in userControlller.loginUser' });
  }
};

userController.signJWT = async (req, res, next) => {
  try {
    const { username } = req.body;
    const token = jwt.sign({ username }, process.env.ACCESS_TOKEN_SECRET);
    await res.cookie('jwt', token, {
      maxAge: 86400000,
      httpOnly: true,
      secure: true,
    });
    return next();
  } catch (err) {
    return next({ error: 'Error in userController.signJWT' });
  }
};

// will be used for verifying authorization to secret routes
userController.verifyJWT = async (req, res, next) => {
  try {
    console.log('THIS IS HEADER', req.headers);
    const { cookie } = req.headers;
    console.log('THIS IS COOKIE', cookie);
    const jwtToken = cookie.slice(4);
    const verify = await jwt.verify(jwtToken, process.env.ACCESS_TOKEN_SECRET);
    console.log('THIS IS VERIFY', verify);
    next();
  } catch (err) {
    return next({ error: 'Error in userController.verifyJWT' });
  }
};

userController.logoutUser = async (req, res, next) => {
  try {
    res.clearCookie('jwt');
    next();
  } catch (err) {
    return next({ error: 'Error in userController.logoutUser' });
  }
};

userController.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.body;
    const values = [id];
    const text = `
      DELETE FROM
        _user
      WHERE
        id = $1
      RETURNING *
    `;
    const deletedUser = await db.query(text, values);
    console.log(deletedUser.rows);
    return next();
  } catch (err) {
    return next({ error: 'error in userController.deleteUser' });
  }
};

userController.editUser = async (req, res, next) => {
  try {
    const { id, username, password, profile_picture } = req.body;
    // query to update username
    if (username) {
      const result = await doesUserNameExist(username);
      if (!result.rows.length) {
        // change username where id = $1
        const values = [username, id];
        const usernameQuery = `
          UPDATE _user
          SET username = $1
          WHERE id = $2
          RETURNING *
        `;
        const newUsername = await db.query(usernameQuery, values);
        console.log(newUsername.rows);
      } else {
        return next({ error: 'Username already exists' });
      }
    }
    // to update profile_picture
    if (profile_picture) {
      const values = [profile_picture, id];
      const profPicQuery = `
        UPDATE _user
        SET profile_picture = $1
        WHERE id = $2
        RETURNING *
      `;
      const updatedUser = await db.query(profPicQuery, values);
      console.log(updatedUser.rows);
    }
    // to update password
    if (password) {
      const saltRounds = 10;
      const hashedPass = await bcrypt.hash(password, saltRounds);
      const values = [hashedPass, id];
      const passwordQuery = `
        UPDATE _user
        SET password = $1
        WHERE id = $2
        RETURNING * 
      `;
      const newPassword = await db.query(passwordQuery, values);
      console.log(newPassword.rows);
    }
    return next();
  } catch (err) {
    return next({ error: 'error in userController.editUser' });
  }
};

module.exports = userController;
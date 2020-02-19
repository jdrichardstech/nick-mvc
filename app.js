const express = require('express');
const app = express();
const logger = require('morgan');
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

require('dotenv').config();

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(`MongoDB Error: ${err}`));

const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger('dev'));

app.get('/', (req, res) => {
  User.find({}).then(users => {
    res.json(users);
  });
});

app.post('/', (req, res) => {
  return new Promise((resolve, reject) => {
    const { name, email, password } = req.body;
    if (name.length === 0 || email.length === 0 || password.length === 0) {
      return res.json({ message: 'All fields must be completed' });
    }

    User.findOne({ email: req.body.email }).then(user => {
      if (user) {
        return res.status(400).json({ message: 'User Already exists' });
      }
      const newUser = new User();
      const { name, email, password } = req.body;
      // with hash REMEMBER TO DO Login without hash FIRST THEN COME BACK HERE
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);

      newUser.name = name;
      newUser.email = email;
      newUser.password = hash;
      newUser
        .save()
        .then(user => {
          res.status(200).json({ message: 'User created', user });
          resolve(user);
        })
        .catch(err => reject(err));
    });
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  User.findOne({ email })
    .then(user => {
      bcrypt
        .compare(req.body.password, user.password)
        .then(user => {
          return res.send(
            user === true ? 'You are now logged in' : 'Incorrect credentials'
          );
        })
        .catch(err => {
          return res.status(500).json({ message: 'Server error' });
        });
    })
    .catch(err => {
      return console.log('User not found');
    });
});

app.put('/update/:id', (req, res) => {
  try {
    return new Promise((resolve, reject) => {
      User.findById(req.params.id)
        .then(user => {
          const { name, email } = req.body;
          user.name = name ? name : user.name;
          user.email = email ? email : user.email;

          user
            .save()
            .then(user => {
              return res.status(200).json({ message: 'User Updated', user });
            })
            .catch(err => reject(err));
        })
        .catch(err => {
          return res.status(400).json({ message: 'No User Found' });
        });
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server Error', err: err.message });
  }
});

app.delete('/delete/:id', (req, res) => {
  try {
    return new Promise((resolve, reject) => {
      User.findByIdAndDelete({ _id: req.params.id })
        .then(user => {
          console.log(user.id);
          console.log(req.params.id);
          return res.status(200).json({ message: 'User Deleted' });
        })
        .catch(err => res.status(400).json({ message: 'No User To Delete' }));
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', err: err.message });
  }
});

app.listen(port, (req, res) => {
  console.log(`Server running on port: ${port}`);
});

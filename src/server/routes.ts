import express from 'express';
import { getMovieById, getMultiSearch, getPopularMovies } from './theMovieDB';
import { findUser, insertUser, deleteUser, updateUser } from './users';
import { ObjectId } from 'mongodb';

const router = express.Router();

router.get('/movies/popular', async (_req, res, next) => {
  try {
    const popularMovies = await getPopularMovies();
    res.status(200).json(popularMovies);
  } catch (error) {
    next(error);
  }
});

router.get('/movies/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const movie = await getMovieById(id);
    res.status(200).json(movie);
  } catch (error) {
    next(error);
  }
});

router.get('/actors/:id', (_req, res) => {
  res.status(404).send();
});

router.get('/shows/:id', (_req, res) => {
  res.status(404).send();
});

router.get('/search', async (req, res, next) => {
  try {
    const { query } = req.query;
    if (typeof query !== 'string') {
      res.status(400).send('Query is malformed');
      return;
    }

    const searchResult = await getMultiSearch(query);

    res.status(200).json(searchResult);
  } catch (error) {
    next(error);
  }
});

router.post('/users/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await findUser({ email, password });
    if (!user) {
      res.status(404).send('User not found');
      return;
    }

    res.setHeader(
      'Set-Cookie',
      `userId=${user._id};path=/;Max-Age=${365 * 24 * 60 * 60}`
    );

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

router.post('/users', async (req, res, next) => {
  try {
    const user = req.body;
    const insertedUser = await insertUser(user);
    if (!insertedUser) {
      res.status(409).send('Registration failed');
      return;
    }
    res.status(201).json(insertedUser);
  } catch (error) {
    next(error);
  }
});

router.delete('/users/:email', async (req, res, next) => {
  try {
    const { email } = req.params;
    const deleted = await deleteUser({ email });
    if (!deleted) {
      res.status(404).send('Deletion failed');
      return;
    }
    res.status(200).send(`User ${email} deleted`);
  } catch (error) {
    next(error);
  }
});

router.post('/users/forgot-password', (_req, res) => {
  res.status(404).send();
});

router.get('/users/me', async (req, res, next) => {
  try {
    const { userId } = req.cookies;
    if (!userId) {
      return res.status(401).end('Unauthorized! You have to login first.');
    }
    const user = await findUser({ _id: new ObjectId(userId) });
    if (!user) {
      res.status(404).send('User not found');
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

router.patch('/users/me', async (req, res, next) => {
  try {
    const { userId } = req.cookies;
    const fieldsToUpdate = req.body;
    if (!userId) {
      return res.status(401).end('Unauthorized! You have to login first.');
    }
    const updated = await updateUser(userId, fieldsToUpdate);
    if (!updated) {
      res.status(404).send('User not found');
      return;
    }
    const user = await findUser({ _id: new ObjectId(userId) });
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

export default router;

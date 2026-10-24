"use strict";

const userService = require("../../../services/admin/users/userService");

async function getUsers(req, res, next) {
  try {
    const users = await userService.getUsers();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const user = await userService.updateUser(
      req.params.id,
      req.body || {},
      req.user,
    );
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    await userService.deleteUser(req.params.id, req.user);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = { getUsers, getUserById, updateUser, deleteUser };

const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function handleFindUser(username) {
  return users.find(elem => elem.username === username);
}

function handleCreateNewTodo(username, todo) {
  users.map(elem => {
    if (elem.username === username) {
      elem.todos.push(todo);
    }
  });
}

function handleUpdateTodo(todo, user, id) {
  const todoToUpdate = user.todos.find(todo => todo.id === id);

  todoToUpdate.title = todo.title;
  todoToUpdate.deadline = new Date(todo.deadline);

  return todoToUpdate;
}

function handlePatchTodo(user, id) {
  const todoToPatch = user.todos.find(todo => todo.id === id);

  todoToPatch.done = true;

  return todoToPatch;
}

function handleDeleteTodo(user, id) {
  const todoToDelete = user.todos.findIndex(todoElem => {
    return todoElem.id === id;
  });

  user.todos.splice(todoToDelete, todoToDelete + 1);
  return;
}

function checkExistsTodo(request, response, next) {
  const { user } = request;
  const { id } = request.params;

  const matchTodo = user.todos.findIndex(todoElem => {
    return todoElem.id === id;
  });

  if (matchTodo === -1) {
    return response.status(404).json({ error: "todo not found on list user list!" })
  }

  next();
}

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const testIfUserExists = handleFindUser(username);

  if (testIfUserExists === undefined) {
    return response.status(404).json({error: "User does not exists on our dataBase"});
  }

  request.user = testIfUserExists;

  next();
}

function handleCheckExistsUserAccountOnCreation(request, response, next) {
  const { username } = request.body;

  const searchUserOnDatabase = handleFindUser(username);

  if (searchUserOnDatabase !== undefined) {
    return response.status(400).json({error: "User already exists on our dataBase"});
  }

  next();
}

app.post('/users', handleCheckExistsUserAccountOnCreation, (request, response) => {
  const { name, username } = request.body;

  const user = {
    name,
    username,
    id: uuidv4(),
    todos: []
  }

  users.push(user);

  return response.status(201).json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;

  const usernameMatched = handleFindUser(username);

  return response.status(200).json(usernameMatched.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  const { title, deadline } = request.body;

  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  handleCreateNewTodo(username, newTodo);

  return response.status(201).json(newTodo);
});

app.put('/todos/:id', checksExistsUserAccount, checkExistsTodo, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;
  const { id } = request.params;

  const updateTodo = {
    title,
    deadline
  }
  
  const updatedTodo = handleUpdateTodo(updateTodo, user, id);

  return response.json(updatedTodo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checkExistsTodo, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  const patchedTodo = handlePatchTodo(user, id);

  return response.json(patchedTodo);
});

app.delete('/todos/:id', checksExistsUserAccount, checkExistsTodo, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  handleDeleteTodo(user, id);

  return response.status(204).send();
});

module.exports = app;
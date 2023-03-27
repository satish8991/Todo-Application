const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
var format = require("date-fns/format");
const path = require("path");
const app = express();
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
app.use(express.json());
var isValid = require("date-fns/isValid");
console.log(isValid(2021 - 01 - 12));
let result = format(new Date("2021-7-8"), "yyyy-MM-dd");
console.log(result);
const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const aunthenticateFunction = (request, response, next) => {
  const { category, priority, status, due_date } = request.query;

  if (
    priority !== undefined &&
    priority !== "HIGH" &&
    priority !== "MEDIUM" &&
    priority !== "LOW"
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    status !== undefined &&
    status !== "TO DO" &&
    status !== "IN PROGRESS" &&
    status !== "DONE"
  ) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    category !== undefined &&
    category !== "WORK" &&
    category !== "HOME" &&
    category !== "LEARNING"
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (isValid(new Date(due_date)) === false && due_date !== undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    next();
  }
};

//API1
const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusAndPriority = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};
const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasCategoryAndPrioroty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};
app.get("/todos/", aunthenticateFunction, async (request, response) => {
  let data = null;
  let getTodoQuery = null;
  const { search_q = "", category, priority, status } = request.query;
  switch (true) {
    case hasStatus(request.query):
      getTodoQuery = `SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE todo LIKE '%${search_q}%' AND status='${status}'`;
      break;
    case hasPriority(request.query):
      getTodoQuery = `SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE todo LIKE '%${search_q}%' AND priority='${priority}'`;
      break;
    case hasStatusAndPriority(request.query):
      getTodoQuery = `SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE todo LIKE '%${search_q}%' AND priority='${priority}' AND status = '${status}'`;
      break;
    case hasCategoryAndStatus(request.query):
      getTodoQuery = `SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE todo LIKE '%${search_q}%' AND category='${category}' AND status = '${status}'`;
      break;
    case hasCategory(request.query):
      getTodoQuery = `SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE todo LIKE '%${search_q}%' AND category='${category}'`;
      break;
    case hasCategoryAndPrioroty(request.query):
      getTodoQuery = `SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE todo LIKE '%${search_q}%' AND category='${category}' AND priority = '${priority}'`;
      break;
    default:
      getTodoQuery = `SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE todo LIKE '%${search_q}%'`;
      break;
  }
  data = await db.all(getTodoQuery);
  response.send(data);
});
//API2
app.get("/todos/:todoId/", aunthenticateFunction, async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE id='${todoId}'`;
  const specificTodo = await db.get(getTodoQuery);
  response.send(specificTodo);
});
//API3
app.get("/agenda/", aunthenticateFunction, async (request, response) => {
  const { date } = request.query;
  const dateTodoQuery = `SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE strftime("%Y-%m-%d",due_date)='${date}'`;
  const dateTodo = await db.all(dateTodoQuery);
  response.send(dateTodo);
});
//API4
app.post("/todos/", aunthenticateFunction, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const postQuery = `INSERT INTO todo(id, todo, priority, status, category, due_date)
                        VALUES ('${id}','${todo}','${priority}','${status}','${category}','${dueDate}')`;
  await db.run(postQuery);
  response.send("Todo Successfully Added");
});
//API5
app.put("/todos/:todoId/", aunthenticateFunction, async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;
  let updateValue;
  let updateQuery;
  switch (true) {
    case status !== undefined:
      updateValue = "Status";
      updateQuery = `UPDATE todo SET status='${status}' WHERE id='${todoId}'`;
      break;
    case priority !== undefined:
      updateValue = "Priority";
      updateQuery = `UPDATE todo SET priority='${priority}' WHERE id='${todoId}'`;
      break;
    case todo !== undefined:
      updateValue = "Todo";
      updateQuery = `UPDATE todo SET todo='${todo}' WHERE id='${todoId}'`;
      break;
    case category !== undefined:
      updateValue = "Category";
      updateQuery = `UPDATE todo SET category='${category}' WHERE id='${todoId}'`;
      break;
    case dueDate !== undefined:
      updateValue = "Due Date";
      updateQuery = `UPDATE todo SET due_date='${dueDate}' WHERE id='${todoId}'`;
      break;
  }
  await db.run(updateQuery);
  response.send(`${updateValue} Updated`);
});
//API6
app.delete(
  "/todos/:todoId/",
  aunthenticateFunction,
  async (request, response) => {
    const { todoId } = request.params;
    const deleteQuery = `DELETE todo WHERE id='${todoId}'`;
    await db.run(deleteQuery);
    response.send("Todo Deleted");
  }
);

module.exports = app;

require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const prisma = require("../db/prisma");
const httpMocks = require("node-mocks-http");
const EventEmitter = require("events");
const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion");
const {
  index,
  show,
  create,
  update,
  deleteTask,
} = require("../controllers/taskController");

let user1 = null;
let user2 = null;
let saveRes = null;
let saveData = null;
let saveTaskId = null;

beforeAll(async () => {
  await prisma.Task.deleteMany();
  await prisma.User.deleteMany();
  user1 = await prisma.User.create({ data: { name: "Bob",
    email: "bob@sample.com", hashedPassword: "nonsense" } });
  user2 = await prisma.User.create({ data: { name: "Alice",
    email: "alice@sample.com", hashedPassword: "nonsense" } });
});

afterAll(() => {
  prisma.$disconnect();
});

it("14. cant create a task without a user id", async () => {
  const req = httpMocks.createRequest({
    method: "POST",
    body: { title: "first task" },
  });
  saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
  expect.assertions(1);
  try {
    await waitForRouteHandlerCompletion(create, req, saveRes);
  } catch (e) {
    expect(e.name).toBe("TypeError");
  }
});

it("15. can't create task with bogus user id", async () => {
  const req = httpMocks.createRequest({
    method: "POST",
    body: { title: "first task" },
    params: { userId: "bogus-id" },
  });
  req.user = { id: "bogus-id" };
  const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
  await expect(
    waitForRouteHandlerCompletion(create, req, res)
  ).rejects.toBeInstanceOf(Error);
});

it("16. valid user id returns 201", async () => {
  const req = httpMocks.createRequest({
    method: "POST",
    body: { title: "first task" },
    params: { userId: user1.id },
  });
  req.user = { id: user1.id };
  saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
  await waitForRouteHandlerCompletion(create, req, saveRes);
  saveTaskId = saveRes._getJSONData().id;
  expect(saveRes.statusCode).toBe(201);
});

it("17. returned object has expected title", () => {
  const data = saveRes._getJSONData();
  expect(data.title).toBe("first task");
});

it("18. object has correct isCompleted value", () => {
  const data = saveRes._getJSONData();
  expect(data.isCompleted).toBe(false);
});

it("19. object does not include userId", () => {
  const data = saveRes._getJSONData();
  expect(data.userId).toBeUndefined();
});

it("20. you can't get tasks without user id", async () => {
  const req = httpMocks.createRequest({
    method: "GET",
  });
  const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
  await expect(
    waitForRouteHandlerCompletion(index, req, res)
  ).rejects.toBeInstanceOf(Error);
});

it("21. index returns 200", async () => {
  const req = httpMocks.createRequest({
    method: "GET",
    params: { userId: user1.id },
  });
  req.user = { id: user1.id };
  saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
  await waitForRouteHandlerCompletion(index, req, saveRes);
  expect(saveRes.statusCode).toBe(200);
});

it("22. returned tasks array length is 1", () => {
  saveData = saveRes._getJSONData();
  expect(saveData.tasks.length).toBe(1);
});

it("23. title in first array object is as expected", () => {
  expect(saveData.tasks[0].title).toBe("first task");
});

it("24. first array object does not contain userId", () => {
  expect(saveData.tasks[0].userId).toBeUndefined();
});

it("25. getting tasks for user2 returns 404", async () => {
  const req = httpMocks.createRequest({
    method: "GET",
    params: { userId: user2.id },
  });
  req.user = { id: user2.id };
  const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
  await waitForRouteHandlerCompletion(index, req, res);
  expect(res.statusCode).toBe(404);
});

it("26. can retrieve created task using show", async () => {
  const req = httpMocks.createRequest({
    method: "GET",
    params: { id: saveTaskId.toString() },
  });
  req.user = { id: user1.id };
  saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
  await waitForRouteHandlerCompletion(show, req, saveRes);
  expect(saveRes.statusCode).toBe(200);
});

it("27. user2 can't retrieve this task, gets 404", async () => {
  const req = httpMocks.createRequest({
    method: "GET",
    params: { id: saveTaskId.toString() },
  });
  req.user = { id: user2.id };
  const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
  await waitForRouteHandlerCompletion(show, req, res);
  expect(res.statusCode).toBe(404);
});

it("28. user1 can set isCompleted to true", async () => {
  const req = httpMocks.createRequest({
    method: "PATCH",
    body: { isCompleted: true },
    params: { id: saveTaskId.toString() },
  });
  req.user = { id: user1.id };
  saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
  await waitForRouteHandlerCompletion(update, req, saveRes);
  expect(saveRes.statusCode).toBe(200);
});

it("29. user2 can't update this task", async () => {
  const req = httpMocks.createRequest({
    method: "PATCH",
    body: { isCompleted: true },
    params: { id: saveTaskId.toString() },
  });
  req.user = { id: user2.id };
  const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
  await waitForRouteHandlerCompletion(update, req, res);
  expect(res.statusCode).toBe(404);
});

it("30. user2 can't delete this task", async () => {
  const req = httpMocks.createRequest({
    method: "DELETE",
    params: { id: saveTaskId.toString() },
  });
  req.user = { id: user2.id };
  const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
  await waitForRouteHandlerCompletion(deleteTask, req, res);
  expect(res.statusCode).toBe(404);
});

it("31. user1 can delete this task", async () => {
  const req = httpMocks.createRequest({
    method: "DELETE",
    params: { id: saveTaskId.toString() },
  });
  req.user = { id: user1.id };
  saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
  await waitForRouteHandlerCompletion(deleteTask, req, saveRes);
  expect(saveRes.statusCode).toBe(200);
});

it("32. retrieving user1's tasks now returns 404", async () => {
  const req = httpMocks.createRequest({
    method: "GET",
    params: { userId: user1.id },
  });
  req.user = { id: user1.id };
  const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
  await waitForRouteHandlerCompletion(index, req, res);
  expect(res.statusCode).toBe(404);
});
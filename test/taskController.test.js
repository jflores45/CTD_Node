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
  const data = saveRes._getJSONData();
  expect(data.tasks.length).toBe(1);
});
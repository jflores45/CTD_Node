require("dotenv").config();
const request = require("supertest");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const prisma = require("../db/prisma");
let agent;
let saveRes;
const { app, server } = require("../app");

beforeAll(async () => {
  await prisma.Task.deleteMany();
  await prisma.User.deleteMany();
  agent = request.agent(app);
});

afterAll(async () => {
  prisma.$disconnect();
  server.close();
});

describe("register a user", () => {
  it("46. it creates the user entry", async () => {
    const newUser = {
      name: "John Deere",
      email: "jdeere@example.com",
      password: "Pa$$word20",
    };
    saveRes = await agent.post("/api/users/register").send(newUser);
    expect(saveRes.status).toBe(201);
  });

 it("47. registration returns object with expected name", async () => {
  expect(saveRes.body.user.name).toBe("John Deere");
 });

  it("48. returned object includes csrfToken", async () => {
    expect(saveRes.body.csrfToken).toBeDefined();
  });
});

it("49. user can logon", async () => {
  saveRes = await agent.post("/api/users/logon").send({
    email: "jdeere@example.com",
    password: "Pa$$word20",
  });
  expect(saveRes.status).toBe(200);
});

it("50. Verify that you are logged in: /api/tasks should not return 401", async () => {
  const res = await agent.get("/api/tasks");
  expect(res.status).not.toBe(401);
});

it("51. Verify that you can log out", async () => {
  const csrfToken = saveRes.body.csrfToken;
  saveRes = await agent
    .post("/api/users/logoff")
    .set("x-csrf-token", csrfToken);
  expect(saveRes.status).toBe(200);
});

it("52. Make sure that you are really logged out: /api/tasks should now return 401", async () => {
  const res = await agent.get("/api/tasks");
  expect(res.status).toBe(401);
});
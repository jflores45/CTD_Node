require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion");
const prisma = require("../db/prisma");
const httpMocks = require("node-mocks-http");
const cookie = require("cookie");
const EventEmitter = require("events");

const { register, logoff, logon } = require("../controllers/userController");
const jwtMiddleware = require("../middleware/jwtMiddleware");
const jwt = require("jsonwebtoken");

// globals
let saveRes = null;
let saveData = null;
let jwtCookie = null;
let req;

function MockResponseWithCookies() {
  const res = httpMocks.createResponse({
    eventEmitter: EventEmitter,
  });

  res.cookie = (name, value, options = {}) => {
    const serialized = cookie.serialize(name, String(value), options);

    let currentHeader = res.getHeader("Set-Cookie");
    if (currentHeader === undefined) {
      currentHeader = [];
    }

    currentHeader.push(serialized);
    res.setHeader("Set-Cookie", currentHeader);
  };

  return res;
}

beforeAll(async () => {
  await prisma.Task.deleteMany();
  await prisma.User.deleteMany();
});

afterAll(() => {
  prisma.$disconnect();
});

describe("testing logon, register, and logoff", () => {

  it("33. A user can be registered.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: {
        name: "Bob",
        email: "bob@sample.com",
        password: "Pa$$word20",
      },
    });

    saveRes = MockResponseWithCookies();

    await waitForRouteHandlerCompletion(register, req, saveRes);

    expect(saveRes.statusCode).toBe(201);
  });

  it("34. The user can logon.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: {
        email: "bob@sample.com",
        password: "Pa$$word20",
      },
    });

    saveRes = MockResponseWithCookies();

    await waitForRouteHandlerCompletion(logon, req, saveRes);

    expect(saveRes.statusCode).toBe(200);
  });


    it("35. jwt cookie exists", () => {
    const setCookieArray = saveRes.get("Set-Cookie");

    jwtCookie = setCookieArray.find((str) =>
      str.startsWith("jwt=")
    );

    expect(jwtCookie).toBeDefined();
  });

    it("36. cookie is HttpOnly", () => {
    expect(jwtCookie).toContain("HttpOnly");
  });

    it("37. register returns expected name", () => {
    const data = saveRes._getJSONData();
    expect(data.name).toBe("Bob");
  });

    it("38. response contains csrfToken", () => {
    const data = saveRes._getJSONData();
    expect(data.csrfToken).toBeDefined();
  });

    it("39. user can logoff", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
    });

    saveRes = MockResponseWithCookies();

    await waitForRouteHandlerCompletion(logoff, req, saveRes);

    expect(saveRes.statusCode).toBe(200);
  });

    it("40. logoff clears cookie", () => {
    const setCookieArray = saveRes.get("Set-Cookie");

    jwtCookie = setCookieArray.find((str) =>
      str.startsWith("jwt=")
    );

    expect(jwtCookie).toContain("Jan 1970");
  });
});
// in user.controller.test.js, after the describe block, before JWT describe

it("41. logon with bad password returns 401", async () => {
  const req = httpMocks.createRequest({
    method: "POST",
    body: {
      email: "bob@sample.com",
      password: "WrongPassword1!",
    },
  });
  saveRes = MockResponseWithCookies();
  await waitForRouteHandlerCompletion(logon, req, saveRes);
  expect(saveRes.statusCode).toBe(401);
});

it("42. can't register with already registered email", async () => {
  const req = httpMocks.createRequest({
    method: "POST",
    body: {
      name: "Bob",
      email: "bob@sample.com", // already registered in test 33
      password: "Pa$$word20",
    },
  });
  saveRes = MockResponseWithCookies();
  await waitForRouteHandlerCompletion(register, req, saveRes);
  expect(saveRes.statusCode).toBe(400);
});

describe("Testing JWT middleware", () => {

    it("61. Returns 401 if JWT cookie missing", async () => {
        const req = httpMocks.createRequest({
        method: "POST",
        });

        saveRes = MockResponseWithCookies();

        await waitForRouteHandlerCompletion(jwtMiddleware, req, saveRes);

        expect(saveRes.statusCode).toBe(401);
    });

    it("62. Returns a 401 if the JWT is invalid", async () => {
        const req = httpMocks.createRequest({
        method: "POST",
        });

        saveRes = MockResponseWithCookies();

        const badToken = jwt.sign(
        { id: 5, csrfToken: "badToken" },
        "badSecret",
        { expiresIn: "1h" }
        );

        req.cookies = { jwt: badToken };

        await waitForRouteHandlerCompletion(jwtMiddleware, req, saveRes);

        expect(saveRes.statusCode).toBe(401);
    });

    it("63. CSRF mismatch fails", async () => {
        const req = httpMocks.createRequest({
        method: "POST",
        });

        saveRes = MockResponseWithCookies();

        const goodToken = jwt.sign(
        { id: 5, csrfToken: "badToken" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
        );

        req.cookies = { jwt: goodToken };

        req.headers = {
        "X-CSRF-TOKEN": "goodtoken",
        };

        await waitForRouteHandlerCompletion(jwtMiddleware, req, saveRes);

        expect(saveRes.statusCode).toBe(401);
    });

    it("64. valid jwt + csrf calls next", async () => {
        req = httpMocks.createRequest({
            method: "POST",
        });

        saveRes = MockResponseWithCookies();

        const goodToken = jwt.sign(
            { id: 5, csrfToken: "goodtoken" },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        req.cookies = { jwt: goodToken };

        req.headers = {
            "X-CSRF-TOKEN": "goodtoken",
        };

        const next = await waitForRouteHandlerCompletion(
            jwtMiddleware,
            req,
            saveRes
        );

        expect(next).toHaveBeenCalled();
    });

    it("65. req.user.id is correct", async () => {
        expect(req.user.id).toBe(5);
    });
});
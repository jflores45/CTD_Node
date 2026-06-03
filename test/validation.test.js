const { userSchema } = require("../validation/userSchema");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

console.log(userSchema.describe());
describe("user object validation tests", () => {
  it("1. doesn't permit a trivial password", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob@sample.com", password: "password" },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key == "password"),
    ).toBeDefined();
  });


  it("2. requires a email to be defined", () => {
    const { error } = userSchema.validate(
      { name: "Bob", password: "password123" },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key == "email"),
    ).toBeDefined();
  });

  it("3. schema does not accept invalid email", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob-at-sample.com", password: "password123" },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key == "email"),
    ).toBeDefined();
  });

  it("4. schema requires a password", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob@sample.com" },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key == "password"),
    ).toBeDefined();
  });

  it("5. user schema requires a name", () => {
    const { error } = userSchema.validate(
      { email: "bob@sample.com", password: "password123" },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key == "name"),
    ).toBeDefined();
  });

 it("6. name must be between 3 and 30 characters", () => {
  const { error } = userSchema.validate(
    { name: "Bo", email: "bob@sample.com", password: "password123" },
    { abortEarly: false },
  );

   expect(
    error.details.find((detail) => detail.context.key == "name"),
  ).toBeDefined();
});

it("7. valid user object should pass validation", () => {
  const { error } = userSchema.validate(
    { name: "Bob", email: "bob@sample.com", password: "Password1!" },
    { abortEarly: false },
  );
  expect(error).toBeUndefined();
});

});

describe("task object validation tests", () => {
  it("8. requires a title", () => {
    const { error } = taskSchema.validate(
      { priority: "high" },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key == "title"),
    ).toBeDefined();
  });

  it("9. if iscompleted specified, it must be a valid boolean", () => {
    const { error } = taskSchema.validate(
      { title: "Sample Task", priority: "high", isCompleted: "not-a-boolean" },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key == "isCompleted"),
    ).toBeDefined();
  });

  it("10. if iscompleted is not speceifed but rest of object is valid default of false provided", () => {
    const { error, value } = taskSchema.validate(
      { title: "Sample Task", priority: "high" },
      { abortEarly: false },
    );
    expect(error).toBeUndefined();
    expect(value.isCompleted).toBe(false);
  });

  it("11. if iscompleted is true it should remain true after validation", () => {
    const { error, value } = taskSchema.validate(
      { title: "Sample Task", priority: "high", isCompleted: true },
      { abortEarly: false },
    );
    expect(error).toBeUndefined();
    expect(value.isCompleted).toBe(true);
  });

  it("12. patchTaskSchema should not require a title", () => {
    const { error } = patchTaskSchema.validate(
      { priority: "high" },
      { abortEarly: false },
    );
    expect(error).toBeUndefined();
  });
  it("13. if no value is provided for iscompletre this remains undefined in return value", () => {
    const { error, value } = patchTaskSchema.validate(
      { title: "Sample Task", priority: "high" },
      { abortEarly: false },
    );
    expect(error).toBeUndefined();
    expect(value.isCompleted).toBeUndefined();
  });
});

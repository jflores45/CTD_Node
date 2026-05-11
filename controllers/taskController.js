const { StatusCodes } = require("http-status-codes");
const { patchTaskSchema } = require("../validation/taskSchema");
const { taskSchema } = require("../validation/taskSchema"); 

const taskCounter = (() => {
    let lastTaskNumber = 0;
    return () => {
        lastTaskNumber += 1;
        return lastTaskNumber;
    };
})();

// CREATE - add a new task
const create = (req, res) => {
    if (!req.body) req.body = {};
    
    const {error, value } = taskSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: error.message
      });
    }
    const newTask = {
      ...value,
      id: taskCounter(),
      userId: global.user_id
    };

    global.tasks.push(newTask);

    const { userId, ...sanitizedTask } = newTask;

    return res.status(StatusCodes.CREATED).json(sanitizedTask);
};

// INDEX - get all tasks for logged in user
const index = (req, res) => {
    const userTasks = global.tasks.filter(
      task => task.userId === global.user_id
    );

    if (userTasks.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: "No tasks found for the logged-in user."});
    }

    const sanitizedTasks = userTasks.map((task) => {
      const { userId, ...sanitizedTask} = task;
      return sanitizedTask;
    });
    // Show all task with user id
    res.json(sanitizedTasks);
};

// SHOW - get single task
const show = (req, res) => {
    const taskId = parseInt(req.params?.id);
    if (!taskId) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "The task ID passed is not valid."})
    }
    const task = global.tasks.find(
      (t) => t.id === taskId && t.userId === global.user_id
    );
    
    if (!task) { // if no such task
        return res.status(StatusCodes.NOT_FOUND).json({message: "That task was not found"}); 
    }
    const {userId, ...sanitizedTask} = task;
    // Show tasks
    res.json(sanitizedTask);
};

// UPDATE - modify task
const update = (req, res) => {
    if (!req.body) req.body = {};

    const taskId = parseInt(req.params.id);

    if (!taskId) {
          return res.status(StatusCodes.BAD_REQUEST).json({ message: "The task ID passed is not valid."})
    }

    const task = global.tasks.find(
      t => t.id === taskId && t.userId === global.user_id
    );

    if (!task)  {
        return res.status(StatusCodes.NOT_FOUND).json({message: "That task was not found"}); 
    }

    const { error, value } = patchTaskSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: error.message
      });
    }

    //  Apply validated data only 
    Object.assign(task, value);

    const { userId, ...sanitizedTask } = task;

    res.json(sanitizedTask);
};

// DELETE - remove task
const deleteTask = (req, res) => {
    const taskId = parseInt(req.params.id);

    if (!taskId){
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "The task ID passed is not valid." });
    }

    const taskIndex = global.tasks.findIndex(
      t => t.id === taskId && t.userId === global.user_id
    );

    if (taskIndex === -1){
      return res.status(StatusCodes.NOT_FOUND).json({message: "That task was not found"});
    }

    const { userId, ...sanitizedTask } = global.tasks[taskIndex];
    // Splice array to remove the task
    global.tasks.splice(taskIndex, 1);

    return res.json(sanitizedTask);
};

// EXPORTS
module.exports = {
    create,
    index,
    show,
    update,
    deleteTask
};
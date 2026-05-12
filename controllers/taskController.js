const { StatusCodes } = require("http-status-codes");
const { patchTaskSchema } = require("../validation/taskSchema");
const { taskSchema } = require("../validation/taskSchema"); 
const prisma = require("../db/prisma");

// CREATE - add a new task
const create = async (req, res, next) => {
    if (!req.body) req.body = {};
    
    const {error, value } = taskSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: error.message
      });
    }

    const isCompleted = value.isCompleted === undefined ? false : value.isCompleted;

    const task = await prisma.task.create({
      data: {
        title: value.title,
        isCompleted,
        userId: global.user_id
      },
      select: {
        id: true,
        title: true,
        isCompleted: true
      }
    });

    return res.status(StatusCodes.CREATED).json(task);
   
};

// INDEX - get all tasks for logged in user
const index = async (req, res, next) => {
    const tasks = await prisma.task.findMany({
      where: {
        userId: global.user_id, // only the tasks for this user!
      },
      select: { title: true, isCompleted: true, id: true }
    });

    if (tasks.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "No tasks found for this user"
      });
    }
    
    return res.status(StatusCodes.OK).json(tasks);
}; 


// SHOW - get single task
const show = async (req, res, next) => {
    const taskId = parseInt(req.params?.id);
    
    if (!taskId) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "The task ID passed is not valid."})
    } 
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: global.user_id
      },
      select: {
        id: true,
        title: true,
        isCompleted: true
      }
    });

    if (!task) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "That task was not found"
      });
    }

    return res.status(StatusCodes.OK).json(task);

};

// UPDATE - modify task
const update = async (req, res, next) => {
    if (!req.body) req.body = {};

    const taskId = parseInt(req.params.id);

    if (!taskId) {
          return res.status(StatusCodes.BAD_REQUEST).json({ message: "The task ID passed is not valid."})
    }

    const { error, value } = patchTaskSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: error.message
      });
    }

    try {

      const task = await prisma.task.update({
        data: value,
        where: {
          id_userId: {
            id: taskId,
            userId: global.user_id
          }
        },
        select: {
          id: true,
          title: true,
          isCompleted: true
        }
      });

      return res.status(StatusCodes.OK).json(task);

    } catch (err) {

      if (err.code === "P2025") {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: "The task was not found."
        });
      }

      return next(err);
  }
};

// DELETE - remove task
const deleteTask = async (req, res, next) => {
    const taskId = parseInt(req.params.id);

    if (!taskId){
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "The task ID passed is not valid." });
    }
     try {

    const task = await prisma.task.delete({
      where: {
        id_userId: {
          id: taskId,
          userId: global.user_id
        }
      },
      select: {
        id: true,
        title: true,
        isCompleted: true
      }
    });

    return res.status(StatusCodes.OK).json(task);

  } catch (err) {

    if (err.code === "P2025") {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "That task was not found"
      });
    }

    return next(err);
  }
};

// EXPORTS
module.exports = {
    create,
    index,
    show,
    update,
    deleteTask
};
const { StatusCodes } = require("http-status-codes");
const { patchTaskSchema } = require("../validation/taskSchema");
const { taskSchema } = require("../validation/taskSchema"); 
const prisma = require("../db/prisma");


// Bulk create with validation
const bulkCreate = async (req, res, next) => {
  const { tasks } = req.body;

  // Validate the tasks array
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ 
      error: "Invalid request data. Expected an array of tasks." 
    });
  }

  // Validate all tasks before insertion
  const validTasks = [];
  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }
    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted || false,
      priority: value.priority || 'medium',
      userId: req.user.id
    });
  }

  // Use createMany for batch insertion
  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false
    });

    res.status(201).json({
      message: "success!",
      tasksCreated: result.count,
      totalRequested: validTasks.length
    });
  } catch (err) {
    return next(err);
  }
};

// CREATE - add a new task
const create = async (req, res, next) => {
    if (!req.body) req.body = {};
    
    const {error, value } = taskSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) return next(error);

    const isCompleted = value.isCompleted === undefined ? false : value.isCompleted;

    const task = await prisma.task.create({
      data: {
        title: value.title,
        priority: value.priority,
        isCompleted,
        userId: req.user.id
      },
      select: {
        id: true,
        title: true,
        priority: true,
        isCompleted: true
      }
    });

    return res.status(StatusCodes.CREATED).json(task);
   
};

// INDEX - get all tasks for logged in user
const index = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const whereClause = { userId: req.user.id };
  if (req.query.find) {
    whereClause.title = {
      contains: req.query.find,        // Matches %find% pattern
      mode: 'insensitive'              // Case-insensitive search (ILIKE in PostgreSQL)
    };
}

// Get tasks with pagination and eager loading
  const tasks = await prisma.task.findMany({
    where: whereClause,
    select: { 
      id: true,
      title: true, 
      isCompleted: true,
      priority: true,
      createdAt: true,
      User: {
        select: {
          name: true,
          email: true
        }
      }
    },
    skip: skip,
    take: limit,
    orderBy: { createdAt: 'desc' }
  });

  if (tasks.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "No tasks found for this user"
    });
  }

  // Get total count for pagination metadata
  const totalTasks = await prisma.task.count({
    where: whereClause
  });

  // Build pagination object with complete metadata
  // Hint: The test expects page, limit, total, pages, hasNext, hasPrev
  // Use Math.ceil() to calculate pages, and compare page * limit with total for hasNext
  const pagination = {
    page,
    limit,
    total: totalTasks,
    pages: Math.ceil(totalTasks / limit),
    hasNext: page * limit < totalTasks,
    hasPrev: page > 1
  };
    
    return res.status(StatusCodes.OK).json({ tasks, pagination });
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
        userId: req.user.id
      },
      select: {
      
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        User: {
          select: {
            name: true,
            email: true
          }
        }
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
      const updatedTask = await prisma.task.update({
            where: {
              id_userId: {
                id: taskId,
                userId: req.user.id
              }
            },
            data: {
              title: value.title,
              isCompleted: value.isCompleted,
              priority: value.priority
            },
            select: {
              id: true,
              title: true,
              isCompleted: true,
              priority: true,
              createdAt: true,
              User: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          });

      return res.status(StatusCodes.OK).json(updatedTask);

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
          userId: req.user.id
        }
      },
      select: {
       
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
    bulkCreate,
    create,
    index,
    show,
    update,
    deleteTask
};
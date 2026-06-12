const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `${field}已被使用`;
    error.statusCode = 400;
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    error.message = errors.join(', ');
    error.statusCode = 400;
  }

  if (err.name === 'CastError') {
    error.message = '资源不存在';
    error.statusCode = 404;
  }

  res.status(error.statusCode || 500).json({
    message: error.message || '服务器错误'
  });
};

module.exports = errorHandler;
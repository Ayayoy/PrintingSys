// middleware/paginateMiddleware.js

const paginateMiddleware = (model) => async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
  
      const options = {
        page,
        limit,
        collation: { locale: 'en', strength: 2 }, // Case-insensitive search
      };
  
      const result = await model.paginate({}, options);
  
      res.paginatedResult = {
        success: true,
        data: result.docs,
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        currentPage: result.page,
      };
  
      next();
    } catch (error) {
      next(error);
    }
  };
  
  module.exports = paginateMiddleware;

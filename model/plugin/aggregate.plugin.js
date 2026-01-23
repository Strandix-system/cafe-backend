const aggregatePaginate = (schema) => {
    schema.statics.aggregatePaginate = async function (filter, options) {
        let sort = {};

        // Determine the sorting criteria
        if (options.sortBy) {
            const sortingCriteria = [];
            options.sortBy.split(',').forEach((sortOption) => {
                const [key, order] = sortOption.split(':');
                sortingCriteria.push({ [key]: order === 'desc' ? -1 : 1 });
            });
            sort = Object.assign({}, ...sortingCriteria); // Combine multiple sorting criteria
        } else {
            sort = { createdAt: -1 }; // Default sorting by createdAt descending
        };

        const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
        const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 0;
        const skip = page ? (page) * limit : 0;

        // Aggregation pipeline for pagination
        const [countResult, docsResult] = await Promise.all([
            // Count query to get total document count
            this.aggregate([
                { $match: filter },  // Match the filter
                { $count: "totalDocuments" }  // Count the documents
            ]),

            // Main aggregation query for pagination and sorting
            this.aggregate([
                { $match: filter },  // Match the filter
                { $skip: skip },  // Skip documents based on page and limit
                { $limit: limit },  // Limit the number of documents
                { $sort: sort },  // Sort by createdAt in descending order
            ]).allowDiskUse(true)
        ]);

        const totalResults = countResult.length > 0 ? countResult[0].totalDocuments : 0;
        const totalPages = limit > 0 ? Math.ceil(totalResults / limit) : 0;

        // Prepare the paginated result
        const result = {
            results: docsResult,
            page,
            limit,
            totalPages,
            totalResults,
        };

        return result;
    };
};

export { aggregatePaginate };

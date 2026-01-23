const paginate = (schema) => {
    schema.statics.paginate = async function (filter, options) {
        let sort = '';
        if (options.sortBy) {
            const sortingCriteria = [];
            options.sortBy.split(',').forEach((sortOption) => {
                const [key, order] = sortOption.split(':');
                sortingCriteria.push((order === 'desc' ? '-' : '') + key);
            });
            sort = sortingCriteria.join(' ');
        } else {
            sort = '-createdAt';
        };

        const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 0;  //This code start paging from 0
        const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 0;
        const skip = page ? (page) * limit : 0;

        // const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;   //This code start paging from 1
        // const skip = (page - 1) * limit;

        const countPromise = this.countDocuments(filter).exec();
let docsPromise = this.find(filter)
  .select("-password -__v") // 👈 HIDE FIELDS
  .sort(sort)
  .skip(skip)
  .limit(limit);

        if (options.populate) {
            options.populate.split(',').forEach((populateOption) => {
                docsPromise = docsPromise.populate(
                    populateOption
                        .split('.')
                        .reverse()
                        .reduce((a, b) => ({ path: b, populate: a }))
                );
            });
        };

        docsPromise = docsPromise.exec();

        return Promise.all([countPromise, docsPromise]).then((values) => {
            const [totalResults, results] = values;
            const totalPages = limit > 0 ? Math.ceil(totalResults / limit) : 0;
            const result = {
                results,
                page,
                limit,
                totalPages,
                totalResults,
            };
            return Promise.resolve(result);
        });
    };
};

export { paginate };

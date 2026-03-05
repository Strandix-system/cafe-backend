import Customer from "../../../model/customer.js";

const customerService = {
  createCustomer: async (body) => {

    const { name, phoneNumber, adminId } = body;

    let customer = await Customer.findOne({
      phoneNumber,
      adminId,
    });
    if (customer) {
      customer.name = name;
      await customer.save();
      return customer;
    }
    const newCustomer = await Customer.create({
      name,
      phoneNumber,
      adminId,
    });
    return newCustomer.toObject();
  },
  getCustomers: async (filter, options, user) => {

    let adminId;

    if (user.role === "admin") {
      adminId = user._id;
    }

    if (user.role === "superadmin") {
      if (!filter.adminId) {
        throw Object.assign(
          new Error("adminId is required to view customers"),
          { statusCode: 400 }
        );
      }
      adminId = filter.adminId;
    }

    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const skip = (page - 1) * limit;

    const matchStage = { adminId };

    if (filter.search) {
      matchStage.$or = [
        { name: { $regex: filter.search, $options: "i" } },
        { phoneNumber: { $regex: filter.search, $options: "i" } }
      ];
    }

    const result = await Customer.aggregate([

      { $match: matchStage },

      // 🔥 Join completed orders only
      {
        $lookup: {
          from: "orders",
          let: { customerId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$customerId"] },
                    { $eq: ["$orderStatus", "completed"] }
                  ]
                }
              }
            }
          ],
          as: "orders"
        }
      },

      // 🔥 Add computed fields
      {
        $addFields: {
          totalVisit: { $size: "$orders" },

          totalSpent: {
            $sum: "$orders.totalAmount"
          },

          lastVisitDate: { $max: "$orders.createdAt" },

          isVIP: {
            $gt: [{ $sum: "$orders.totalAmount" }, 5000]
          }
        }
      },

      // 🔥 Favorite Item Calculation
      {
        $addFields: {
          favoriteItem: {
            $let: {
              vars: {
                allItems: {
                  $reduce: {
                    input: "$orders",
                    initialValue: [],
                    in: { $concatArrays: ["$$value", "$$this.items"] }
                  }
                }
              },
              in: {
                $arrayElemAt: [
                  {
                    $map: {
                      input: {
                        $slice: [
                          {
                            $sortArray: {
                              input: {
                                $map: {
                                  input: {
                                    $setUnion: ["$$allItems.name"]
                                  },
                                  as: "itemName",
                                  in: {
                                    name: "$$itemName",
                                    count: {
                                      $size: {
                                        $filter: {
                                          input: "$$allItems",
                                          as: "i",
                                          cond: {
                                            $eq: ["$$i.name", "$$itemName"]
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              },
                              sortBy: { count: -1 }
                            }
                          },
                          1
                        ]
                      },
                      as: "top",
                      in: "$$top.name"
                    }
                  },
                  0
                ]
              }
            }
          }
        }
      },

      {
        $project: {
          orders: 0
        }
      },

      {
        $facet: {
          metadata: [
            { $count: "totalResults" }
          ],
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
          ]
        }
      }
    ]);

    const customers = result[0].data;
    const totalResults = result[0].metadata[0]?.totalResults || 0;

    return {
      results: customers,
      page,
      limit,
      totalPages: Math.ceil(totalResults / limit),
      totalResults
    };
  },
  getCustomerById: async (id) => {
    const customer = await Customer.findById(id);
    if (!customer) {
      throw Object.assign(new Error("Customer not found"), { statusCode: 404 });
    }
    return customer;
  },
  updateCustomer: async (id, data) => {
    const customer = await Customer.findById(id);
    if (!customer) {
      throw Object.assign(new Error("Customer not found"), { statusCode: 404 });
    } else {
      Object.assign(customer, data);
      await customer.save();
      return customer;
    }
  },
  deleteCustomer: async (id) => {
    const customer = await Customer.findById(id);
    if (!customer) {
      throw Object.assign(new Error("Customer not found"), { statusCode: 404 });
    } else {
      await customer.deleteOne();
      return true;
    };
  },
};


export default customerService;

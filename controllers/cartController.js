/* eslint-disable no-restricted-syntax */
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

const Cart = require('../models/cartModel');
const Service = require('../models/serviceModel');
const WorkersAndServiceBinding = require('../models/workersAndServiceBindingModel');
const Worker = require('../models/workerModel');
const CartItem = require('../models/cartItemModel');
const AppointmentWorkerAvailability = require('../models/appointmentWorkerAvailabilityModel');
const AppointmentBasket = require('../models/appointmentBasketModel');
const Appointment = require('../models/appointmentModel');

function calculateTotal(itemsToBeCalculated) {
  return itemsToBeCalculated.reduce(
    (total, itemToBeCalculated) => total + itemToBeCalculated.price,
    0
  );
}

exports.viewCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({
    customer: req.customer.id
  });
  res.status(200).json({
    status: 'success',
    data: {
      cart: cart
    }
  });
});
//Merchant/:merchantId/sendCart
//Merchant/:merchantId/sendCart
exports.sendCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({
    customer: req.customer.id
  });
  const cartItemIds = cart.items.map(item => item._id);
  if (!cartItemIds) {
    return next(new AppError('There is no cartItems'), 404);
  }

  const uniqueWorkerAvailabilityIds = new Set();
  for (const cartItem of cart.items) {
    const availabilityId = cartItem.appointmentWorkerAvailability;
    if (uniqueWorkerAvailabilityIds.has(availabilityId)) {
      const sameWorkerAvailabilityItems = cart.items.filter(
        item => availabilityId === item.appointmentWorkerAvailability
      );
      if (sameWorkerAvailabilityItems.length === 0) {
        return next(new AppError('There must be at least one', 404));
      }

      const referenceWorker = sameWorkerAvailabilityItems[0].worker;

      for (let i = 1; i < sameWorkerAvailabilityItems.length; i += 1) {
        if (sameWorkerAvailabilityItems[i].worker !== referenceWorker) {
          return next(
            new AppError(
              'AppointmentWorkerAvailabilities for different workers can not be same.',
              409
            )
          );
        }
      }
    } else {
      uniqueWorkerAvailabilityIds.add(availabilityId);
    }
  }

  const appointmentsToBeCreated = [];
  const appointmentBasket = new AppointmentBasket();
  appointmentBasket.customer = cart.customer;
  appointmentBasket.merchant = cart.merchant;

  await Promise.all(
    cartItemIds.map(async cartItemId => {
      const cartItem = await CartItem.findById(cartItemId)
        .populate({
          path: 'service',
          select: 'price isDeleted workersAndServiceBinding',
          populate: {
            path: 'workersAndServiceBinding',
            model: 'WorkersAndServiceBindingModel',
            select: 'workers'
          }
        })
        .populate({
          path: 'worker',
          select: 'isDeleted'
        })
        .populate({
          path: 'appointmentWorkerAvailability',
          select: 'status isItStillThereForWorkerAvailability isEmbowered date'
        });
      if (!cartItem) {
        return next(new AppError('CartItem not found', 404));
      }
      if (!cartItem.service) {
        return next(new AppError('CartItem does not have service', 404));
      }
      if (cartItem.price !== cartItem.service.price) {
        return next(
          new AppError('CartItemPrice does not match the ServicePrice', 422)
        );
      }
      if (cartItem.service.isDeleted === true) {
        cart.items.filter(item => !(item._id === cartItemId));
        await cart.save();
        await CartItem.findByIdAndUpdate(cartItemId, { isDeleted: true });
        return next(new AppError('Service is deleted', 404));
      }
      if (cartItem.worker.isDeleted === true) {
        await CartItem.findByIdAndUpdate(cartItemId, {
          worker: null,
          appointmentWorkerAvailability: null
        });
        return next(new AppError('Worker is deleted', 404));
      }
      const workertoCheck = cartItem.worker._id;
      if (
        !cartItem.service.workersAndServiceBinding.workers.includes(
          workertoCheck
        )
      ) {
        return next(new AppError('Worker does not have worker', 404));
      }
      if (!cartItem.appointmentWorkerAvailability) {
        await CartItem.findByIdAndUpdate(cartItemId, {
          appointmentWorkerAvailability: null
        });
        return next(
          new AppError(
            'CartItem does not have appointmentWorkerAvailability',
            404
          )
        );
      }
      if (cartItem.appointmentWorkerAvailability.status !== 'available') {
        return next(
          new AppError(
            'CartItem.AppointmentWorkerAvailability is not available',
            400
          )
        );
      }
      if (
        cartItem.appointmentWorkerAvailability
          .isItStillThereForWorkerAvailability === false
      ) {
        return next(
          new AppError(
            'CartItem.AppointmentWorkerAvailability is not still there',
            400
          )
        );
      }
      if (cartItem.appointmentWorkerAvailability.isEmbowered === true) {
        return next(
          new AppError(
            'CartItem.AppointmentWorkerAvailability is embowered',
            400
          )
        );
      }
      const currentItemRemoved = cart.items.filter(
        item => !item._id.equals(cartItem._id)
      );
      const isAppointmentWorkerAvailabilityMatched = currentItemRemoved.some(
        item =>
          item.appointmentWorkerAvailability &&
          item.appointmentWorkerAvailability.equals(
            cartItem.appointmentWorkerAvailability._id
          )
      );
      if (isAppointmentWorkerAvailabilityMatched) {
        const isAvailabilityMatched = appointmentsToBeCreated.some(
          container =>
            container.appointmentWorkerAvailability &&
            container.appointmentWorkerAvailability.equals(
              cartItem.appointmentWorkerAvailability._id
            )
        );

        if (!isAvailabilityMatched) {
          const cartItemsWithSameCalendar = cart.items.filter(
            item =>
              item.appointmentWorkerAvailability &&
              item.appointmentWorkerAvailability.equals(
                cartItem.appointmentWorkerAvailability._id
              )
          );
          const services = [];
          let totalPrice = 0;
          cartItemsWithSameCalendar.forEach(ciwsm => {
            services.push(ciwsm.service);
            totalPrice += ciwsm.price;
          });
          const appointmentToBeCreated = new Appointment({
            customer: req.customer.id,
            services: services,
            appointmentWorkerAvailability:
              cartItem.appointmentWorkerAvailability._id,
            worker: cartItem.worker._id,
            exactDay: cartItem.appointmentWorkerAvailability.date,
            totalPrice: totalPrice,
            appointmentBasket: appointmentBasket
          });
          appointmentsToBeCreated.push(appointmentToBeCreated);
        }
      } else {
        const services = [];
        services.push(cartItem.service._id);
        const appointmentToBeCreated = new Appointment({
          customer: req.customer.id,
          services: services,
          appointmentWorkerAvailability:
            cartItem.appointmentWorkerAvailability._id,
          worker: cartItem.worker._id,
          exactDay: cartItem.appointmentWorkerAvailability.date,
          totalPrice: cartItem.price,
          appointmentBasket: appointmentBasket
        });
        appointmentsToBeCreated.push(appointmentToBeCreated);
      }
    })
  );
  const appointmentIds = appointmentsToBeCreated.map(
    appointment => appointment._id
  );
  appointmentBasket.appointments = appointmentIds;
  await appointmentBasket.save();

  await Promise.all(
    appointmentsToBeCreated.map(async appointmentToBeCreated => {
      await appointmentToBeCreated.save();
    })
  );

  await Promise.all(
    cartItemIds.map(async cartItemId => {
      await CartItem.findByIdAndUpdate(cartItemId, { isDeleted: true });
    })
  );
  cart.items = [];
  cart.total = 0;
  await cart.save();

  res.status(200).json({
    status: 'success',
    data: {
      appointmentsCreated: appointmentsToBeCreated
    }
  });
});

exports.addServicesToCartItem = catchAsync(async (req, res, next) => {
  const { serviceIds } = req.body;

  if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
    return next(
      new AppError("Servis ID'leri belirtilmemiş veya geçersiz.", 400)
    );
  }

  let cart = await Cart.findOne({
    customer: req.customer.id
  });

  if (!cart) {
    cart = new Cart({
      customer: req.customer.id
    });
  } else {
    await Promise.all(
      serviceIds.map(async serviceId => {
        const isExistingItem = cart.items.find(item =>
          item.service.equals(serviceId)
        );

        if (isExistingItem) {
          return next(
            new AppError('A service cannot be purchased multiple times', 409)
          );
        }
        const cartItem = new CartItem({ service: serviceId });
        const currentService = await Service.findById(serviceId);
        if (!currentService) {
          return next(
            new AppError(
              `Servis ID'si '${serviceId}' ile eşleşen bir servis bulunamadı.`,
              404
            )
          );
        }
        cartItem.price = currentService.price;
        await cartItem.save();

        cart.items.push(cartItem);
      })
    );
  }

  cart.total = calculateTotal(cart.items);

  await cart.save();

  res.status(200).json({
    status: 'success',
    data: {
      cart: cart
    }
  });
});

exports.removeItemFromCart = catchAsync(async (req, res, next) => {
  if (!req.body.merchant || !req.body.service || !req.body.customer) {
    req.body.merchant = req.params.merchantId;
    req.body.cartItem = req.params.cartItemId;
    req.body.customer = req.customer.id;
  }

  const cart = await Cart.findOne({
    customer: req.body.customer
  });

  if (!cart) {
    return next(new AppError('There is no cart already', 404));
  }
  const deletedCartItemId = cart.items.find(item =>
    item._id.equals(req.body.cartItem)
  );
  cart.items = cart.items.filter(item => !item._id.equals(req.body.cartItem));
  cart.total = calculateTotal(cart.items);

  await CartItem.findByIdAndUpdate(deletedCartItemId, { isDeleted: true });
  await cart.save();

  res.status(200).json({
    status: 'success',
    data: {
      cart: cart
    }
  });
});
//Merchant/:merchantId/ViewCard/:cartItemId ???????????????????????????????
exports.getSpecificItemInTheCard = catchAsync(async (req, res, next) => {
  if (req.body.merchant || req.body.customer || req.body.cartItem) {
    req.body.merchant = req.params.merchantId;
    req.body.cartItem = req.params.cartItemId;
    req.body.customer = req.customer.id;
  }

  const cart = await Cart.findOne({
    customer: req.body.customer
  });

  if (!cart) {
    return next(new AppError('Card not be found', 404));
  }

  const cartItemId = req.body.cartItem;
  cart.items.find(item => item._id.toString() === cartItemId);

  if (!cartItemId) {
    return next(new AppError('Service not found in the cart', 404));
  }

  const cartItem = await CartItem.findById(cartItemId);

  res.status(200).json({
    status: 'success',
    data: {
      cartItem: cartItem
    }
  });
});
// Merchant/:merchantId/ViewCard/:cartItemId/getWorkersToCartItem
exports.getWorkersToCartItem = catchAsync(async (req, res, next) => {
  const { cartItemId } = req.params;

  const cartItem = await CartItem.findById(cartItemId);

  if (!cartItem) {
    return next(new AppError('CartItem not found', 404));
  }

  const serviceToBeBought = await Service.findById(cartItem.service);
  const workersAndServiceBindingId = serviceToBeBought.workersAndServiceBinding;

  if (!workersAndServiceBindingId) {
    return next(
      new AppError('workersAndServiceBinding not found in the cart', 404)
    );
  }

  const workersAndServiceBinding = await WorkersAndServiceBinding.findById(
    workersAndServiceBindingId
  );

  if (!workersAndServiceBinding) {
    return next(new AppError('workersAndServiceBinding not be found', 404));
  }

  const workersIds = workersAndServiceBinding.workers.map(worker =>
    worker.toString()
  );

  const workers = await Worker.find({ _id: { $in: workersIds } });

  res.status(200).json({
    status: 'success',
    data: {
      workers: workers
    }
  });
});
// Merchant/:merchantId/ViewCard/:cartItemId/addWorkerToCartItem/:workerId
exports.addWorkerToCartItem = catchAsync(async (req, res, next) => {
  const { workerId } = req.params;
  const worker = await Worker.findById(workerId);

  if (!worker) {
    return next(new AppError('worker not be found', 404));
  }
  const { cartItemId } = req.params;
  const cartItem = await CartItem.findById(cartItemId);

  cartItem.worker = workerId;

  const cart = await Cart.findOne({
    customer: req.customer.id
  });

  await Promise.all(
    cart.items.map(async item => {
      if (item.worker === workerId) {
        cartItem.appointmentWorkerAvailability =
          item.appointmentWorkerAvailability;
        await cartItem.save();
      }
    })
  );

  await cartItem.save();

  res.status(200).json({
    status: 'success',
    data: {
      cartItem: cartItem
    }
  });
});

// Merchant/:merchantId/ViewCard/:cartItemId/getAppointmentWorkerAvailabilitiesToCartItem
exports.getAppointmentWorkerAvailabilitiesToCartItem = catchAsync(
  async (req, res, next) => {
    const { cartItemId } = req.params;

    const cartItem = await CartItem.findById(cartItemId);

    if (!cartItem) {
      return next(new AppError('CartItem not found', 404));
    }

    const cart = await Cart.findOne({
      customer: req.customer.id
    });
    await Promise.all(
      cart.items.map(async item => {
        if (item.worker === cartItem.worker && item._id !== cartItem._id) {
          return next(
            new AppError(
              'AppointmentWorkerAvailability can not be defined manually if there is already an item with same worker ',
              409
            )
          );
        }
      })
    );

    const selectedWorker = await Worker.findById(cartItem.worker);
    if (!selectedWorker) {
      return next(new AppError('worker not found'), 404);
    }
    const selectedWorkerId = selectedWorker._id;
    const usableAppointmentWorkerAvailabilities = await AppointmentWorkerAvailability.find(
      {
        worker: selectedWorkerId,
        isEmbowered: false,
        isItStillThereForWorkerAvailability: true,
        isDormant: false
      }
    )
      .populate('date')
      .populate('timeSlot');

    res.status(200).json({
      status: 'success',
      data: {
        usableAppointmentWorkerAvailabilities: usableAppointmentWorkerAvailabilities
      }
    });
  }
);

// Merchant/:merchantId/ViewCard/:cartItemId/addAppointmentWorkerAvailabilitiesToCartItem/:appointmentWorkerAvailabilityId
exports.addAppointmentWorkerAvailabilitiesToCartItem = catchAsync(
  async (req, res, next) => {
    const { appointmentWorkerAvailabilityId } = req.params;
    const appointmentWorkerAvailability = await AppointmentWorkerAvailability.findById(
      appointmentWorkerAvailabilityId
    );

    if (!appointmentWorkerAvailability) {
      return next(
        new AppError('appointmentWorkerAvailability not be found', 404)
      );
    }
    if (appointmentWorkerAvailability.status === 'booked') {
      return next(new AppError('AppointmentWorkerAvailability is booked'), 400);
    }
    if (appointmentWorkerAvailability.status === 'unavailable') {
      return next(
        new AppError('AppointmentWorkerAvailability is unavailable'),
        400
      );
    }

    const { cartItemId } = req.params;
    const cartItem = await CartItem.findById(cartItemId).populate({
      path: 'appointmentWorkerAvailability',
      model: 'AppointmentWorkerAvailability',
      select: 'date'
    });
    if (!cartItem) {
      return next(new AppError('CartItem not found', 404));
    }

    const appointmentsOfCustomerInSpecificDay = await Appointment.find({
      customer: req.customer.id,
      exactDay: appointmentWorkerAvailability.date
    });

    for (const appointmentOfCustomerInSpecicDay of appointmentsOfCustomerInSpecificDay) {
      if (appointmentOfCustomerInSpecicDay.isCancelled === false) {
        const isServiceSame = appointmentOfCustomerInSpecicDay.services.some(
          service => service === cartItem.service
        );

        switch (appointmentOfCustomerInSpecicDay.status) {
          case 'pending':
            if (
              isServiceSame &&
              appointmentOfCustomerInSpecicDay.exactDay ===
                cartItem.appointmentWorkerAvailability.date
            ) {
              return next(
                new AppError(
                  'You can not assign a new appointment request for same service at same day while there is already a pending appointment'
                )
              );
            }
            break;
          case 'approved':
            if (
              isServiceSame &&
              appointmentOfCustomerInSpecicDay.exactDay ===
                cartItem.appointmentWorkerAvailability.date
            ) {
              return next(
                new AppError(
                  'You can not assign a new appointment request for same service at same day while there is already an approved appointment'
                )
              );
            }
            break;
          case 'rejected':
            if (
              isServiceSame &&
              appointmentOfCustomerInSpecicDay.appointmentWorkerAvailability ===
                cartItem.appointmentWorkerAvailability._id
            ) {
              return next(
                new AppError(
                  'You can not assign a new appointment request for same service at same timeSlot while there is already an rejected appointment'
                )
              );
            }
            break;

          default:
        }
      }
    }

    cartItem.appointmentWorkerAvailability = appointmentWorkerAvailabilityId;

    await cartItem.save();

    res.status(200).json({
      status: 'success',
      data: {
        appointmentWorkerAvailability: appointmentWorkerAvailability
      }
    });
  }
);

exports.clearCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ customer: req.customer.id });

  if (cart) {
    cart.items = [];
    cart.total = 0;
    await cart.save();
  }

  res.status(200).json({
    status: 'success',
    data: {
      cart: cart
    }
  });
});

// Merchant/:merchantId/ViewCard/:cartItemId/refreshCartItem
exports.refreshCartItem = catchAsync(async (req, res, next) => {
  await CartItem.findByIdAndUpdate(req.params.cartItemId, {
    worker: null,
    appointmentWorkerAvailability: null
  });

  const cart = await Cart.find({
    customer: req.customer.id
  });

  res.status(200).json({
    status: 'success',
    data: {
      cart: cart
    }
  });
});

exports.getCart = factory.getOne(Cart);
exports.getAllCarts = factory.getAll(Cart);

// Do NOT update passwords with this!
exports.updateCart = factory.updateOne(Cart);
exports.deleteCart = factory.deleteOne(Cart);

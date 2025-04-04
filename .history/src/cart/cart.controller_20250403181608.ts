async checkout(userId: string, orderPayload: CreateOrderPayload): Promise<Order> {
    try {
      this.logger.debug(`Processing checkout for userId: ${userId}`);
      
      return this.dataSource.transaction(async (transactionalEntityManager) => {
        // Find cart
        const cart = await this.cartRepository.findOne({
          where: { 
            user_id: userId,
            status: CartStatuses.OPEN
          },
          relations: ['items', 'items.product']
        });

        if (!cart) {
          throw new NotFoundException('Cart not found');
        }

        // Update cart status
        await transactionalEntityManager.update(Cart, cart.id, {
          status: CartStatuses.ORDERED,
          updated_at: new Date()
        });

        // Create order
        const order = transactionalEntityManager.create(Order, {
          user_id: orderPayload.userId,
          cart_id: orderPayload.cartId,
          status: OrderStatuses.Open,
          total: orderPayload.total,
          delivery: orderPayload.address,
          payment: null,
          comments: null,
          status_history: [{
            status: OrderStatuses.Open,
            timestamp: Date.now(),
            comment: 'Order Created'
          }]
        });

        const savedOrder = await transactionalEntityManager.save(Order, order);

        return await transactionalEntityManager.findOne(Order, {
          where: { id: savedOrder.id },
          relations: ['cart', 'cart.items', 'cart.items.product']
        });
      });
    } catch (error) {
      this.logger.error(`Error processing checkout for user ${userId}:`, error);
      throw error;
    }
}

const db= require('../config/database');

class Cart{
    static async findByUserId(userId){
        try{
            const cart=await db.query(`
                SELECT c.CartID, c.UserId, c.CreatedAt, c.UpdatedAt
                FROM Carts c 
                WHERE c.UserID = ?
                `,[userId]);

            return cart[0] || null;
        }
        catch(error){
            console.error('Find cart by user Id error: ', error);
            throw error;
        }
    }

    static async create(userId){
        try{
            const result= await db.query(`
                INSERT INTO Carts (UserID)
                VALUES (?)
                `,[userId]);
            return result.insertId;
        }
        catch(error){
            console.error('Create Cart error:', error);
            throw error;
        }
    }
    static async getCartWithItem(userId){
        try{let cart= await this.findByUserId(userId);
        if(!cart){
            const cartId= await this.create(userId);
            cart={CartID: cartId, UserID:userId};
        }
        const item= await db.query(`
            SELECT 
                ci.CartItemID,
                ci.ProductID,
                ci.Quantity,
                ci.AddedAt,
                p.ProductName,
                p.ProductCode,
                p.Price,
                p.StockQuantity,
                p.ImageURLs,
                p.IsActive
                FROM CartItems ci
                INNER JOIN Products p ON ci.ProductID = p.ProductID
                WHERE ci.CartID=?
                ORDER BY ci.AddedAt DESC
            `,[cart.CartID]);
            const totalAmount= item.reduce((total, item)=> {
                return total + (item.Price*item.Quantity)
            },0);
            return{
                cart:cart,
                item:item,
                totalAmount:totalAmount,
                totalItems: item.length
            };
    }
    catch(error){
        console.error('Error when get cart with item: ',error);
        throw error;
    }
    }
    static async addItem(userId,productId,quantity=1){
        try{
            let cart= await this.findByUserId(userId);
            if(!cart){
                const cartId= await this.create(userId);
                cart={CartId: cartId, UserId: userId};
            }
            const product= await db.query(`
                SELECT ProductID, ProductName, Price, StockQuantity, IsActive
                FROM Products
                WHERE ProductID=? AND IsActive = 1
                `, [productId]);
            if(product.length === 0){
                throw new Error('Products is not available!')
            }
            if(product[0].StockQuantity< quantity){
                throw new Error('Inventoty Stock is not enough!')
            }
            const existingItem= await db.query(`
                SELECT CartItemId, Quantity
                FROM CartItems
                WHERE CartID= ? AND ProductID = ?
                `,[cart.CartID,productId]);
            if (existingItem.length > 0) {
                const newQuantity = existingItem[0].Quantity + quantity;
                await db.query(`
                UPDATE CartItems 
                SET Quantity = ? 
                WHERE CartItemID = ?
                `, [newQuantity, existingItem[0].CartItemID]);
            } else {
                await db.query(`
                INSERT INTO CartItems (CartID, ProductID, Quantity) 
                VALUES (?, ?, ?)
                `, [cart.CartID, productId, quantity]);
            }
            await db.query(`
                UPDATE Carts 
                SET UpdatedAt = GETDATE() 
                WHERE CartID = ?
            `, [cart.CartID]);
            return await this.getCartWithItems(userId);
            
        }catch (error) {
            console.error('Add item to cart error:', error);
            throw error;
        }   
    }
    static async updateItemQuantity(userId, cartItemId, quantity) {
    try {
      if (quantity <= 0) {
        // Nếu số lượng <= 0 thì xóa sản phẩm khỏi giỏ hàng
        return await this.removeItem(userId, cartItemId);
      }

      // Kiểm tra cart item thuộc về user
      const cartItem = await db.query(`
        SELECT ci.CartItemID, ci.ProductID, p.StockQuantity
        FROM CartItems ci
        INNER JOIN Carts c ON ci.CartID = c.CartID
        INNER JOIN Products p ON ci.ProductID = p.ProductID
        WHERE ci.CartItemID = ? AND c.UserID = ?
      `, [cartItemId, userId]);

      if (cartItem.length === 0) {
        throw new Error('Sản phẩm không tồn tại trong giỏ hàng');
      }

      if (cartItem[0].StockQuantity < quantity) {
        throw new Error('Số lượng sản phẩm trong kho không đủ');
      }

      // Cập nhật số lượng
      await db.query(`
        UPDATE CartItems 
        SET Quantity = ? 
        WHERE CartItemID = ?
      `, [quantity, cartItemId]);

      // Cập nhật thời gian sửa giỏ hàng
      await db.query(`
        UPDATE Carts 
        SET UpdatedAt = GETDATE() 
        WHERE UserID = ?
      `, [userId]);

      return await this.getCartWithItems(userId);
    } catch (error) {
      console.error('Update cart item quantity error:', error);
      throw error;
    }
  }

  // Xóa sản phẩm khỏi giỏ hàng
  static async removeItem(userId, cartItemId) {
    try {
      // Kiểm tra cart item thuộc về user
      const cartItem = await db.query(`
        SELECT ci.CartItemID
        FROM CartItems ci
        INNER JOIN Carts c ON ci.CartID = c.CartID
        WHERE ci.CartItemID = ? AND c.UserID = ?
      `, [cartItemId, userId]);

      if (cartItem.length === 0) {
        throw new Error('Sản phẩm không tồn tại trong giỏ hàng');
      }

      // Xóa sản phẩm
      await db.query(`
        DELETE FROM CartItems 
        WHERE CartItemID = ?
      `, [cartItemId]);

      // Cập nhật thời gian sửa giỏ hàng
      await db.query(`
        UPDATE Carts 
        SET UpdatedAt = GETDATE() 
        WHERE UserID = ?
      `, [userId]);

      return await this.getCartWithItems(userId);
    } catch (error) {
      console.error('Remove item from cart error:', error);
      throw error;
    }
  }

  // Xóa toàn bộ giỏ hàng
  static async clearCart(userId) {
    try {
      const cart = await this.findByUserId(userId);
      if (!cart) return;

      await db.query(`
        DELETE FROM CartItems 
        WHERE CartID = ?
      `, [cart.CartID]);

      await db.query(`
        UPDATE Carts 
        SET UpdatedAt = GETDATE() 
        WHERE CartID = ?
      `, [cart.CartID]);

      return await this.getCartWithItems(userId);
    } catch (error) {
      console.error('Clear cart error:', error);
      throw error;
    }
  }
}

module.exports = Cart;
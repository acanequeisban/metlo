import { AppDataSource } from "data-source"
import { Error400BadRequest, Error404NotFound } from "errors"
import { Cart } from "models"
import { PurchaseCartParams } from "types"
import { ProductService } from "./product"

export class CartService {
  static async createNewCart() {
    try {
      const cartRepository = AppDataSource.getRepository(Cart)
      const cart = cartRepository.create()
      await cartRepository.save(cart)
      return cart.uuid
    } catch (err) {
      console.error(`Error in CartService.createNewCart: ${err}`)
      throw err
    }
  }

  static async getCart(cartUuid: string) {
    try {
      const cartRepository = AppDataSource.getRepository(Cart)
      const cart = await cartRepository.findOne({
        where: {
          uuid: cartUuid,
        },
        relations: {
          products: true,
        },
      })
      return cart
    } catch (err) {
      console.error(`Error in CartService.getCart: ${err}`)
      throw err
    }
  }

  static async addProduct(cartUuid: string, productUuid: string) {
    try {
      const cartRepository = AppDataSource.getRepository(Cart)
      const product = await ProductService.getProduct(productUuid)
      if (!product) {
        throw new Error404NotFound("Product to add to cart not found.")
      }
      const cart = await this.getCart(cartUuid)
      if (!cart) {
        throw new Error404NotFound("Cart not found.")
      }
      cart.products.push(product)
      await cartRepository.save(cart)
      return
    } catch (err) {
      console.error(`Error in CartService.addProduct: ${err}`)
      throw err
    }
  }

  static async purchaseCart(
    cartUuid: string,
    purchaseCartParams: PurchaseCartParams,
  ) {
    try {
      const cart = await this.getCart(cartUuid)
      if (!cart) {
        throw new Error404NotFound("Cart not found.")
      }
      const { firstName, lastName, ccn, code, expirationDate, address } =
        purchaseCartParams
      if (
        !firstName ||
        !lastName ||
        !ccn ||
        !code ||
        !expirationDate ||
        !address
      ) {
        throw new Error400BadRequest(
          "Please provide first name, last name, ccn, code, expiration date, address.",
        )
      }
      return { ccn: purchaseCartParams.ccn }
    } catch (err) {
      console.error(`Error in CartService.purchaseCart: ${err}`)
      throw err
    }
  }
}

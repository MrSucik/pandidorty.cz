import { db, orders, type NewOrder, type OrderPhoto } from './index';
import { eq, desc } from 'drizzle-orm';
import { saveOrderPhotos } from './photos';

// Generate a unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
}

// Interface for order form data (matching the form structure)
export interface OrderFormData {
  name: string;
  email: string;
  phone: string;
  date: string; // ISO date string
  orderCake: boolean;
  orderDessert: boolean;
  size: string;
  flavor: string;
  dessertChoice: string;
  message: string;
}

// Create order from form data
export async function createOrderFromForm(
  formData: OrderFormData, 
  photos?: File[]
): Promise<
  | { success: true; order: NewOrder & { id: number; photos: OrderPhoto[] } }
  | { success: false; error: string }
> {
  try {
    const orderNumber = generateOrderNumber();
    
    const orderData: Omit<NewOrder, 'id' | 'createdAt' | 'updatedAt'> = {
      orderNumber,
      customerName: formData.name,
      customerEmail: formData.email,
      customerPhone: formData.phone || null,
      deliveryDate: new Date(formData.date),
      
      // Order type flags
      orderCake: formData.orderCake,
      orderDessert: formData.orderDessert,
      
      // Cake details (only if cake is ordered)
      cakeSize: formData.orderCake ? formData.size : null,
      cakeFlavor: formData.orderCake ? formData.flavor : null,
      cakeMessage: formData.orderCake && formData.message ? formData.message : null,
      
      // Dessert details (only if dessert is ordered)
      dessertChoice: formData.orderDessert ? formData.dessertChoice : null,
      
      // Legacy/optional fields
      shippingAddress: null,
      billingAddress: null,
      totalAmount: null,
      
      status: 'pending',
      notes: null,
      createdById: null, // No admin user creating this order
      updatedById: null,
    };

    const [newOrder] = await db.insert(orders).values(orderData).returning();
    
    // Save photos if provided
    let savedPhotos: OrderPhoto[] = [];
    if (photos && photos.length > 0) {
      const photoResult = await saveOrderPhotos(newOrder.id, photos);
      if (photoResult.success) {
        savedPhotos = photoResult.photos;
      } else {
        console.warn('Failed to save some photos:', photoResult.error);
        // Don't fail the order creation if photos fail
      }
    }
    
    return { 
      success: true, 
      order: { ...newOrder, photos: savedPhotos }
    };
  } catch (error) {
    console.error('Error creating order:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

// Get order by order number
export async function getOrderByNumber(orderNumber: string) {
  const order = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  return order[0] || null;
}

// Get all orders
export async function getAllOrders() {
  return await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt));
} 
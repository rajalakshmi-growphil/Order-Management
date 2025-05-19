from flask import Flask, jsonify
from db_config import get_db_connection
from flask_cors import CORS

from flask import request
from datetime import datetime

app = Flask(__name__)
CORS(app)
def parse_product_ids_qty(product_ids_qty):
    """
    Converts '33944:6;34080:2' to list of tuples [(33944, 6), (34080, 2)]
    """
    if not product_ids_qty:
        return []
    items = product_ids_qty.strip(';').split(';')
    result = []
    for item in items:
        if ':' in item:
            try:
                pid, qty = item.split(':')
                result.append((int(pid), int(qty)))
            except ValueError:
                continue 
    return result



@app.route('/orders', methods=['GET'])
def list_orders():
    connection = get_db_connection()
    try:
        
        with connection.cursor() as cursor:
            
            cursor.execute("SELECT * FROM cart WHERE cart_status != 'active'")
            carts = cursor.fetchall()

            result = []

            for cart in carts:
                product_list = parse_product_ids_qty(cart.get('product_ids_qty'))

                product_details = []
                total_items = 0

                for product_id, qty in product_list:
                    cursor.execute("""
                        SELECT name, price, selling_price, image_url 
                        FROM products 
                        WHERE product_id = %s
                    """, (product_id,))
                    product = cursor.fetchone()
                    if product:
                        product_info = {
                            'product_id': product_id,
                            'name': product['name'],
                            'price': product['price'],
                            'selling_price': product['selling_price'],
                            'image_url': product['image_url'],
                            'quantity': qty
                        }
                        total_items += qty
                        product_details.append(product_info)

                result.append({
                    'cart_id': cart['cart_id'],
                    'status': cart['cart_status'],
                    'created_date': cart['cart_created_date'],
                    'updated_date': cart['cart_updated_date'],
                    'total_cart_value': cart['total_cart_value'],
                    'shipping_charge': cart.get('shipping_charge', 0.0),
                    'coupon_savings': cart.get('coupon_savings', 0.0),
                    'auto_refill': bool(cart.get('auto_refill', 0)),
                    'delivery_type': cart.get('delivery_type', ''),
                    'delivery_address_id': cart.get('delivery_address_id',''),
                    'total_items': total_items,
                    'products': product_details,
                    'tracking_id': cart.get('order_tracking_id')
                })

        return jsonify({'orders': result}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/orders', methods=['POST'])
def create_order():
    data = request.get_json()
    required_fields = ['product_ids_qty', 'cart_status', 'customer_id', 'delivery_address_id']

    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    parsed_products = parse_product_ids_qty(data.get('product_ids_qty'))
    if not parsed_products:
        return jsonify({'error': 'Invalid product_ids_qty format. Expected format "product_id:qty;..."'}), 400

    product_ids = [pid for pid, _ in parsed_products]

    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = f"""
                SELECT product_id, selling_price 
                FROM products 
                WHERE product_id IN ({','.join(['%s'] * len(product_ids))})
            """
            cursor.execute(sql, tuple(product_ids))
            products = cursor.fetchall()

            found_ids = {p['product_id'] for p in products}
            missing_ids = list(set(product_ids) - found_ids)
            if missing_ids:
                return jsonify({'error': f'Invalid product_id(s): {missing_ids}'}), 400

            price_map = {p['product_id']: float(p['selling_price']) for p in products}

            total_cart_value = 0.0
            for pid, qty in parsed_products:
                total_cart_value += price_map[pid] * qty

            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

            sql = """
                INSERT INTO cart (
                    cart_created_date,
                    cart_updated_date,
                    cart_status,
                    product_ids_qty,
                    delivery_address_id,
                    prescription_id,
                    total_cart_value,
                    auto_refill,
                    coupon_savings,
                    payment_id,
                    payment_sign,
                    customer_id,
                    shipping_charge,
                    rzp_order_id,
                    order_tracking_id,
                    coupon_applied,
                    delivery_type
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """

            cursor.execute(sql, (
                now,
                now,
                data.get('cart_status'),
                data.get('product_ids_qty'), 
                data.get('delivery_address_id'),
                data.get('prescription_id'),
                total_cart_value,
                data.get('auto_refill', 0),
                data.get('coupon_savings', 0.0),
                data.get('payment_id'),
                data.get('payment_sign'),
                data.get('customer_id'),
                data.get('shipping_charge', 0.0),
                data.get('rzp_order_id'),
                data.get('order_tracking_id'),
                data.get('coupon_applied'),
                data.get('delivery_type')
            ))

            connection.commit()
            return jsonify({'message': 'Order created successfully'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()



@app.route('/orders/<int:cart_id>', methods=['GET'])
def get_order_by_id(cart_id):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM cart WHERE cart_id = %s", (cart_id,))
            cart = cursor.fetchone()

            if not cart:
                return jsonify({'error': 'Cart not found'}), 404

            product_list = parse_product_ids_qty(cart.get('product_ids_qty'))
            product_details = []
            total_items = 0

            for product_id, qty in product_list:
                cursor.execute("""
                    SELECT name, price, selling_price, image_url 
                    FROM products 
                    WHERE product_id = %s
                """, (product_id,))
                product = cursor.fetchone()
                if product:
                    product_info = {
                        'product_id': product_id,
                        'name': product['name'],
                        'price': product['price'],
                        'selling_price': product['selling_price'],
                        'image_url': product['image_url'],
                        'quantity': qty
                    }
                    total_items += qty
                    product_details.append(product_info)

            order_details = {
                'cart_id': cart['cart_id'],
                'status': cart['cart_status'],
                'created_date': cart['cart_created_date'],
                'updated_date': cart['cart_updated_date'],
                'total_cart_value': cart['total_cart_value'],
                'shipping_charge': cart.get('shipping_charge', 0.0),
                'coupon_savings': cart.get('coupon_savings', 0.0),
                'auto_refill': bool(cart.get('auto_refill', 0)),
                'delivery_type': cart.get('delivery_type', ''),
                'delivery_address_id': cart.get('delivery_address_id',0),
                'total_items': total_items,
                'products': product_details,
                'tracking_id': cart.get('order_tracking_id')
            }

            return jsonify(order_details), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()



if __name__ == '__main__':
    app.run(debug=True)


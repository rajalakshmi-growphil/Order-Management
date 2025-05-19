import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./style/YourOrders.css";

import pendingIcon from "../assets/icons/Pending.svg";
import confirmedIcon from "../assets/icons/Confirmed.svg";
import outForDeliveryIcon from "../assets/icons/out_for_ delivery.svg";
import deliveredIcon from "../assets/icons/delivered.svg";
import callNowIcon from "../assets/icons/CallNow.svg";
import payNowIcon from "../assets/icons/pay_now.svg";
import reorderIcon from "../assets/icons/Reorder.svg";

import Skeleton from "./Skeleton";


const statusMapping = {
  active: {
    icon: pendingIcon,
    label: "Active",
    type: "Pay Now",
    message: "Complete your payment to confirm your order.",
  },
  confirmed: {
    icon: confirmedIcon,
    label: "Confirmed",
    type: "Call Now",
    message: "We’ve received your order. Need help? Call us!",
  },
  pending_confirm: {
    icon: pendingIcon,
    label: "Pending Confirmation",
    type: "Call Now",
    message: "Your order is being reviewed. Contact support for details.",
  },
  payment: {
    icon: confirmedIcon,
    label: "Payment Complete",
    type: "Call Now",
    message: "Payment received! We’ll process your order shortly.",
  },
  "out for delivery": {
    icon: outForDeliveryIcon,
    label: "Out for Delivery",
    type: "Call Now",
    message: "Your order is on the way!",
  },
  delivered: {
    icon: deliveredIcon,
    label: "Delivered",
    type: "Reorder",
    message: "Enjoyed it? Reorder in one click!",
  },
  cancelled: {
    icon: pendingIcon,
    label: "Cancelled",
    type: "Reorder",
    message: "Order was cancelled. Want to try again?",
  },
};

const transformOrder = (order, index) => {
  const rawStatus = order.status?.toLowerCase() || "active";
  const statusDetails = statusMapping[rawStatus] || statusMapping["active"];

  return {
    order_id: order.cart_id || index,
    order_status: rawStatus,
    order_placed_on: new Date(order.created_date).toLocaleDateString(),
    items: order.products?.map(product => ({
      name: product.name,
      unit: `₹${product.selling_price.toFixed(2)}`,
      quantity: product.quantity,
      total_price: product.selling_price * product.quantity,
    })) || [],
    action: {
      label: statusDetails.label,
      type: statusDetails.type,
      message: statusDetails.message,
    },
    icon: statusDetails.icon,
  };
};

const YourOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const actionIconMap = {
    "Call Now": callNowIcon,
    "Pay Now": payNowIcon,
    Reorder: reorderIcon,
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get("http://localhost:5000/orders");
        const fetchedOrders = response.data?.orders || [];
        const transformed = fetchedOrders.map(transformOrder);
        setOrders(transformed);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []); 

  if (loading) {
    return (
      <div className="orders-container">
        {[...Array(3)].map((_, i) => <Skeleton key={i} />)}
      </div>
    );
  }

  if (orders.length === 0) {
    return <div className="orders-container">No orders to display.</div>;
  }

  return (
    <div className="orders-container">
      <h2 className="orders-title">Your Orders</h2>
      {orders.map((order) => {
        const {
          order_id,
          order_status,
          order_placed_on,
          items,
          action: { label, type, message },
          icon,
        } = order;

        const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0).toFixed(2);

        return (
          <div
            className="order-card"
            key={order_id}
            onClick={() => navigate(`/order/${order_id}`, { state: { order } })}
          >
            <div className="order-header">
              <div className="order-status-section">
                {icon && (
                  <img className="status-icon" src={icon} alt={order_status} />
                )}
                <span className="order-status">{label}</span>
              </div>
              <span className="order-date">
                Order Placed On<br />{order_placed_on}
              </span>
            </div>

            <div className="order-items">
              <div className="items-list">
                {items.map(({ name, unit, quantity }, idx) => (
                  <div className="item" key={idx}>
                    <span className="item-name">{name}</span>
                    <span className="item-unit">{unit}</span>
                    <span className="item-qty">x{quantity}</span>
                  </div>
                ))}
              </div>

              <div className="total-price-section">
                <div className="total-label">Total Price</div>
                <div className="total-amount">₹{totalAmount}</div>
              </div>
            </div>

            <div className="order-footer">
              <p className="footer-message">{message}</p>
              <button className="action-btn">
                {actionIconMap[type] && (
                  <img src={actionIconMap[type]} alt={type} />
                )}
                {type}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default YourOrders;

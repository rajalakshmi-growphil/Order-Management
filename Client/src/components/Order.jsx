import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { FaMapMarkerAlt } from "react-icons/fa";
import "./style/Order.css";
import Skeleton from "./Skeleton";

const Order = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/orders/${id}`);
        const data = await response.json();

        if (response.ok) {
          const formattedOrder = {
            order_id: data.cart_id,
            items: data.products.map((p) => ({
              name: p.name,
              image_url: p.image_url,
              unit: "1 pack",
              quantity: p.quantity,
              price_per_unit: p.selling_price,
              total_price: p.quantity * p.selling_price,
            })),
            order_timeline: [
              {
                status: "Ordered",
                timestamp: data.created_date,
                location: "Warehouse",
              },
              {
                status: "Shipped",
                timestamp: data.updated_date,
                location: "Distribution Center",
              },
              {
                status: "Out for delivery",
                timestamp: "",
                location: "",
              },
              {
                status: "Delivered",
                timestamp: "",
                location: "",
              },
            ],
            delivery_location: {
              delivery_type: data.delivery_type,
              address: data.delivery_address_id,
            },
          };

          setOrder(formattedOrder);
        } else {
          console.error("Error fetching order:", data.error);
          setOrder(null);
        }
      } catch (error) {
        console.error("Failed to fetch order:", error);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="orders-container">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    );
  }

  if (!order) return <div className="loading">Order not found</div>;

  const { order_timeline, delivery_location, items, order_id } = order;
  const orderTotal = items.reduce((sum, item) => sum + item.total_price, 0);
  const ALL_STEPS = ["Ordered", "Shipped", "Out for delivery", "Delivered"];

  const timelineMap = {};
  order_timeline.forEach((step) => {
    timelineMap[step.status] = step;
  });

  return (
    <>
      <div className="order-header-wrapper">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FiArrowLeft size={16} />
        </button>
        <h2 className="order-header">Order</h2>
      </div>

      <div className="order-container">
        <h2 className="section-title">
          Order ID <span className="order-id">{order_id}</span>
        </h2>

        <div className="timeline">
          {ALL_STEPS.map((status, index) => {
            const step = timelineMap[status];
            const isCompleted = Boolean(step && step.timestamp);

            return (
              <div key={index} className="timeline-step">
                <div className="step-left">
                  {isCompleted ? (
                    <>
                      <div className="step-date">
                        {step.timestamp.split(",")[0]}
                      </div>
                      <div className="step-time">
                        {step.timestamp.split(",")[1]}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="step-date">--</div>
                      <div className="step-time">--</div>
                    </>
                  )}
                </div>

                <div className="step-center">
                  <div
                    className={`dot ${
                      isCompleted ? "dot-completed" : "dot-pending"
                    }`}
                  />
                  {index < ALL_STEPS.length - 1 && <div className="line" />}
                </div>

                <div
                  className={`step-right ${
                    isCompleted ? "completed" : "pending"
                  }`}
                >
                  <div className="step-status">{status}</div>
                  {isCompleted && step.location && (
                    <div className="step-location">({step.location})</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="location-box">
          <div className="location-label">
            <FaMapMarkerAlt size={14} /> Use Current Location
          </div>
          <div className="location-address">
            Delivery Type: {delivery_location.delivery_type}
          </div>
          <div className="location-address">
            Address_ID: {delivery_location.address}
          </div>
        </div>

        <div className="items-section">
          <h3 className="items-title">
            Items in order{" "}
            <span className="item-count">{items.length} Items</span>
          </h3>
          {items.map((item, idx) => (
            <div key={idx} className="item-row">
              <img src={item.image_url} alt={item.name} className="item-img" />
              <div className="item-details">
                <div className="item-name">{item.name}</div>
                <div className="item-meta">
                  {item.unit} | Rs.{item.price_per_unit.toFixed(2)}
                  <span className="quantity-pill">x{item.quantity}</span>
                </div>
              </div>
              <div className="item-price">Rs.{item.total_price.toFixed(2)}</div>
            </div>
          ))}
          <div className="order-total">
            Order Total <span>Rs.{orderTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Order;

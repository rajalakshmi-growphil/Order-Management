// Skeleton.jsx
import React from "react";
import "./style/YourOrders.css";

const Skeleton = () => {
  return (
    <div className="order-skeleton-card">
      <div className="skeleton-header shimmer"></div>
      <div className="skeleton-items shimmer"></div>
      <div className="skeleton-footer shimmer"></div>
    </div>
  );
};

export default Skeleton;

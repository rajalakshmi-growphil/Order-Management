
import {BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import YourOrders from './components/YourOrders';
import Order from './components/Order';
import NotFound from './Error/NotFound';

const App = () => {
  return (
    <Router>
      <>
      <Routes>
        <Route path="/order" element={<YourOrders />} />
        <Route path="/order/:id" element={<Order />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </>
    </Router>
  )
}

export default App

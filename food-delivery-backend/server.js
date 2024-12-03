const express = require('express');
const cron = require('node-cron');
const app = express();

// Middleware to parse JSON
app.use(express.json());

// In-memory data stores
let menu = [];
let orders = [];

// Add or update menu items
app.post('/menu', (req, res) => {
  const { id, name, price, category } = req.body;

  // Validate data
  if (!id || !name || price <= 0 || !category) {
    return res.status(400).json({ message: 'Invalid menu item details.' });
  }

  // Check if item already exists
  const existingItemIndex = menu.findIndex(item => item.id === id);
  if (existingItemIndex >= 0) {
    // Update existing item
    menu[existingItemIndex] = { id, name, price, category };
  } else {
    // Add new item
    menu.push({ id, name, price, category });
  }

  res.status(201).json({ message: 'Menu item added/updated successfully!' });
});

// Get all menu items
app.get('/menu', (req, res) => {
  res.status(200).json(menu);
});

// Place an order
app.post('/orders', (req, res) => {
  const { items } = req.body;

  // Validate items
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Order must have at least one item.' });
  }

  // Check if all items exist in the menu
  const invalidItems = items.filter(itemId => !menu.some(menuItem => menuItem.id === itemId));
  if (invalidItems.length > 0) {
    return res.status(400).json({ message: `Invalid item IDs: ${invalidItems.join(', ')}` });
  }

  // Create the order
  const orderId = orders.length + 1; // Simple order ID generation
  const newOrder = {
    id: orderId,
    items: items.map(itemId => menu.find(item => item.id === itemId)),
    status: 'Preparing',
  };
  orders.push(newOrder);

  res.status(201).json({ message: 'Order placed successfully!', orderId });
});

// Get order by ID
app.get('/orders/:id', (req, res) => {
  const orderId = parseInt(req.params.id);

  // Find the order
  const order = orders.find(o => o.id === orderId);
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' });
  }

  res.status(200).json(order);
});

// Cron job to update order status every minute
cron.schedule('* * * * *', () => {
  console.log('Running cron job to update order statuses...');

  orders.forEach(order => {
    if (order.status === 'Preparing') {
      order.status = 'Out for Delivery';
    } else if (order.status === 'Out for Delivery') {
      order.status = 'Delivered';
    }
  });

  console.log('Order statuses updated.');
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:3000`);
});

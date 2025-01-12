import fs from 'fs';

const adminFiles = [
  'AdminCategories.module.css',
  'AdminPayments.module.css',
  'AdminDashboard.module.css',
  'AdminDeliveryAddresses.module.css',
  'AdminDiscounts.module.css',
  'AdminOrders.module.css',
  'AdminProducts.module.css',
  'AdminUsers.module.css'
];

adminFiles.forEach((file) => {
  fs.writeFileSync(`styles/${file}`, '', { flag: 'w' });
  console.log(`Created: styles/${file}`);
});


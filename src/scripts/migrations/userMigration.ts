import mongoose from 'mongoose';
import User from '../../models/User';

function delay(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// Adds missing fields and relations missing on older User documents
const userMigration = async () => {
  await require('../../boot');

  console.log('ReadyState', mongoose.connection.readyState);

  while (mongoose.connection.readyState !== 1) {
    console.log('Connection not ready. Retrying...');
    await delay(2000);
  }

  console.log('ReadyState', mongoose.connection.readyState);
  console.log('User migration started');

  const users = await User.find({});
  console.log('Found', users.length, 'users');

  const promises = users.map((user) => {
    // The hardcoded value here is Studio 369 staging's id.
    user.studioId = user.studioId || '628e1a269b4a28063919dd76';
    user.walletAddress = user.walletAddress || undefined;
    user.balances = user.balances || { tfab: '0', tmgt: '0' };

    return user.save();
  });

  await Promise.all(promises);
};

userMigration()
  .then(() => console.log('done'))
  .catch(console.log)
  .finally(() => process.exit(0));

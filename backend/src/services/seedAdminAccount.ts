import User from '../models/User.js';
import logger from '../utils/logger.js';

export async function seedAdminAccount () {
  const adminUserCount = await User.countDocuments({ role: 'admin' });
  if (adminUserCount === 0) {
    const { ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
      logger.warn('⚠️  No admin user found and ADMIN_* env not set.');
    } else {
      await User.create({
        username: ADMIN_USERNAME,
        password:  ADMIN_PASSWORD,
        role:      'admin',
      });
      logger.info(`✅ Created initial admin: ${ADMIN_USERNAME}`);
    }
  }
};
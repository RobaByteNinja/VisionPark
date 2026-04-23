const { User, USER_ROLES } = require("./models/user.model");
const { ValidationError, ConflictError, NotFoundError } = require("../../common/errors");

class UserService {
  async createUser(payload) {
    const { name, email, role } = payload || {};

    if (!name || !email || !role) {
      throw new ValidationError("name, email, and role are required.");
    }
    if (!USER_ROLES.includes(role)) {
      throw new ValidationError(
        `role must be one of: ${USER_ROLES.join(", ")}.`
      );
    }

    try {
      const user = await User.create({ name, email, role });
      return user;
    } catch (error) {
      if (error && error.code === 11000) {
        throw new ConflictError("A user with this email already exists.");
      }
      throw error;
    }
  }

  async getUserById(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found.");
    }
    return user;
  }
}

module.exports = {
  UserService,
};

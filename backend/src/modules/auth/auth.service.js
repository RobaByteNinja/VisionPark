const jwt = require("jsonwebtoken");
const { User, USER_ROLES } = require("../users/models/user.model");
const { env } = require("../../config/env");
const {
  ValidationError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} = require("../../common/errors");
const { hashPassword, comparePassword, toSafeUser } = require("./auth.utils");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim().length > 0;

const sanitizeRoleProfiles = (role, data = {}) => {
  const hasDriverProfile = data.driverProfile !== undefined;
  const hasOwnerProfile = data.ownerProfile !== undefined;
  const hasAttendantProfile = data.attendantProfile !== undefined;

  if (role === "driver") {
    if (!hasDriverProfile || !data.driverProfile || typeof data.driverProfile !== "object") {
      throw new ValidationError("driverProfile is required when role is driver.");
    }
    if (!hasValue(data.driverProfile.licensePlate)) {
      throw new ValidationError(
        "driverProfile.licensePlate is required when role is driver."
      );
    }
    if (hasOwnerProfile || hasAttendantProfile) {
      throw new ValidationError("Only driverProfile is allowed when role is driver.");
    }
    return {
      driverProfile: {
        phone: hasValue(data.driverProfile.phone) ? String(data.driverProfile.phone).trim() : null,
        licensePlate: String(data.driverProfile.licensePlate).trim(),
        vehicleType: hasValue(data.driverProfile.vehicleType)
          ? String(data.driverProfile.vehicleType).trim()
          : null,
        licenseType: hasValue(data.driverProfile.licenseType)
          ? String(data.driverProfile.licenseType).trim()
          : null,
        region: hasValue(data.driverProfile.region) ? String(data.driverProfile.region).trim() : null,
      },
      ownerProfile: null,
      attendantProfile: null,
    };
  }

  if (role === "owner") {
    if (!hasOwnerProfile || !data.ownerProfile || typeof data.ownerProfile !== "object") {
      throw new ValidationError("ownerProfile is required when role is owner.");
    }
    if (hasDriverProfile || hasAttendantProfile) {
      throw new ValidationError("Only ownerProfile is allowed when role is owner.");
    }
    return {
      driverProfile: null,
      ownerProfile: {
        phone: hasValue(data.ownerProfile.phone) ? String(data.ownerProfile.phone).trim() : null,
        companyName: hasValue(data.ownerProfile.companyName)
          ? String(data.ownerProfile.companyName).trim()
          : null,
        tinNumber: hasValue(data.ownerProfile.tinNumber)
          ? String(data.ownerProfile.tinNumber).trim()
          : null,
      },
      attendantProfile: null,
    };
  }

  if (role === "attendant") {
    if (
      !hasAttendantProfile ||
      !data.attendantProfile ||
      typeof data.attendantProfile !== "object"
    ) {
      throw new ValidationError("attendantProfile is required when role is attendant.");
    }
    if (hasDriverProfile || hasOwnerProfile) {
      throw new ValidationError("Only attendantProfile is allowed when role is attendant.");
    }
    const ownerId = data.attendantProfile.ownerId;
    const branchId = data.attendantProfile.branchId;
    if (!hasValue(ownerId) || !hasValue(branchId)) {
      throw new ValidationError(
        "attendantProfile.ownerId and attendantProfile.branchId are required when role is attendant."
      );
    }
    return {
      driverProfile: null,
      ownerProfile: null,
      attendantProfile: {
        ownerId,
        branchId,
        phone: hasValue(data.attendantProfile.phone)
          ? String(data.attendantProfile.phone).trim()
          : null,
        shiftStart: hasValue(data.attendantProfile.shiftStart)
          ? String(data.attendantProfile.shiftStart).trim()
          : null,
        shiftEnd: hasValue(data.attendantProfile.shiftEnd)
          ? String(data.attendantProfile.shiftEnd).trim()
          : null,
      },
    };
  }

  // admin
  if (hasDriverProfile || hasOwnerProfile || hasAttendantProfile) {
    throw new ValidationError("Role admin does not accept role-specific profiles.");
  }
  return {
    driverProfile: null,
    ownerProfile: null,
    attendantProfile: null,
  };
};

const validateRegisterPayload = (data) => {
  const { email, password, name, role } = data || {};
  if (!name || typeof name !== "string" || !name.trim()) {
    throw new ValidationError("name is required.");
  }
  if (!email || typeof email !== "string" || !email.trim()) {
    throw new ValidationError("email is required.");
  }
  if (!EMAIL_REGEX.test(String(email).trim().toLowerCase())) {
    throw new ValidationError("email must be a valid email address.");
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    throw new ValidationError("password is required and must be at least 8 characters.");
  }
  if (!role || !USER_ROLES.includes(role)) {
    throw new ValidationError(`role must be one of: ${USER_ROLES.join(", ")}.`);
  }
  return {
    email: String(email).trim().toLowerCase(),
    password,
    name: name.trim(),
    role,
    ...sanitizeRoleProfiles(role, data || {}),
  };
};

class AuthService {
  async registerUser(data) {
    const {
      email,
      password,
      name,
      role,
      driverProfile,
      ownerProfile,
      attendantProfile,
    } = validateRegisterPayload(data);
    if (role === "admin") {
      throw new ForbiddenError("Self-registration for admin role is not allowed.");
    }

    const passwordHash = await hashPassword(password);
    try {
      const user = await User.create({
        name,
        email,
        role,
        passwordHash,
        status: "active",
        driverProfile,
        ownerProfile,
        attendantProfile,
      });
      return toSafeUser(user);
    } catch (error) {
      if (error && error.code === 11000) {
        throw new ConflictError("A user with this email already exists.");
      }
      throw error;
    }
  }

  async loginUser(email, password) {
    if (!email || !password) {
      throw new ValidationError("email and password are required.");
    }
    const normalized = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalized }).select("+passwordHash");
    if (!user) {
      throw new UnauthorizedError("Invalid email or password.");
    }
    if (user.status !== "active") {
      throw new UnauthorizedError("Account is not active.");
    }
    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedError("Invalid email or password.");
    }
    const token = this.generateToken(user);
    return { token, user: toSafeUser(user) };
  }

  generateToken(user) {
    const payload = {
      userId: String(user._id),
      role: user.role,
    };
    return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  }

  async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("User not found.");
    return toSafeUser(user);
  }
}

module.exports = {
  AuthService,
};
